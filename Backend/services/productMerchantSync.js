import crypto from "node:crypto";
import { getProductPublicationVersion, isPublishedProductCurrent } from "../../src/utils/productPublication.js";

// Durable jobs survive backend restarts. A per-product lease prevents two
// instances submitting different saves concurrently. A newer save wins.
export function createProductMerchantSync({ db, submit, verify, siteBaseUrl, productPath,
  requestRebuild, fetchImpl = fetch, now = Date.now, retryMs = 30000,
  leaseMs = 300000, rebuildRetryMs = 300000 }) {
  const jobs = db.collection("merchantSyncJobs");
  const products = db.collection("products");
  let draining = false;
  let lastRebuildRequestedAt = 0;

  async function enqueue(product) {
    const ref = jobs.doc(product.id);
    return db.runTransaction(async (tx) => {
      const old = await tx.get(ref);
      const current = await tx.get(products.doc(product.id));
      if (!current.exists) return false;
      // A bulk catalog snapshot may be older than an intervening admin save.
      // Queue the current database version, never replace it with the snapshot.
      const version = getProductPublicationVersion(current.data());
      tx.set(ref, {
        status: "pending", version, nextAttemptAt: now(), attempts: 0, lastRebuildAt: now(),
        submittedAt: null,
        leaseUntil: old.data()?.leaseUntil || 0,
        leaseToken: old.data()?.leaseToken || "",
      });
      tx.update(products.doc(product.id), {
        merchantVariantOfferIds: Array.isArray(current.data().merchantVariantOfferIds) ? current.data().merchantVariantOfferIds : [],
        merchantSyncState: { status: "queued", version, checkedAt: now(), reason: "waiting_for_published_page" },
      });
      return true;
    });
  }

  async function process(id) {
    const ref = jobs.doc(id);
    const token = crypto.randomUUID();
    const job = await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const data = snapshot.data();
      if (!snapshot.exists || data.status !== "pending" || data.leaseUntil > now() || data.nextAttemptAt > now()) return null;
      tx.update(ref, { leaseToken: token, leaseUntil: now() + leaseMs });
      return data;
    });
    if (!job) return { status: "queued", offerId: id, reason: "sync_pending" };

    let result;
    let retry = false;
    let lastRebuildAt = job.lastRebuildAt || 0;
    let submittedAt = job.submittedAt ?? null;
    try {
      const snapshot = await products.doc(id).get();
      if (!snapshot.exists) {
        result = { status: "skipped", offerId: id, reason: "product_deleted" };
      } else {
        const product = { ...snapshot.data(), id: snapshot.id };
        if (getProductPublicationVersion(product) !== job.version) {
          result = { status: "queued", offerId: id, reason: "newer_product_save" };
          retry = true;
        } else {
          const path = productPath(product);
          // Inactive products should be removed immediately; malformed records
          // should receive the mapper's eligibility error, not retry forever.
          if (product.isActive !== false && path) {
            const response = await fetchImpl(new URL(path, siteBaseUrl).href, {
              cache: "no-store", signal: AbortSignal.timeout(15000),
            });
            if (!response.ok || !isPublishedProductCurrent(await response.text(), product)) {
              result = { status: "queued", offerId: id, reason: "waiting_for_published_page" };
              retry = true;
              if (requestRebuild && now() - lastRebuildAt >= rebuildRetryMs && now() - lastRebuildRequestedAt >= rebuildRetryMs) {
                lastRebuildRequestedAt = now();
                lastRebuildAt = now();
                const rebuild = await requestRebuild({ action: "merchant_sync_retry", productId: id, productUrl: product.productUrl || "" });
                if (rebuild?.status === "disabled") result.reason = "website_rebuild_not_configured";
                if (rebuild?.status === "error") result.reason = "website_rebuild_failed";
              }
            }
          }
          if (!result) {
            // Re-read the job after the network wait: do not submit an old
            // snapshot when the admin has saved again in the meantime.
            const latest = (await ref.get()).data();
            if (latest?.version !== job.version || latest?.leaseToken !== token) {
              result = { status: "queued", offerId: id, reason: "newer_product_save" };
              retry = true;
            } else {
              if (verify && submittedAt !== null && await verify(product)) {
                result = { status: "confirmed", offerId: id };
              } else if (verify && submittedAt !== null && now() - submittedAt < rebuildRetryMs) {
                result = { status: "upserted", offerId: id, reason: "waiting_for_google_processing" };
                retry = true;
              } else {
                result = await submit(product);
                if (verify && result.status === "upserted") {
                  submittedAt = now();
                  retry = true;
                }
              }
            }
          }
        }
      }
    } catch (error) {
      const invalidData = [400, 422].includes(Number(error?.response?.status));
      result = { status: invalidData ? "error" : "retrying", offerId: id,
        reason: invalidData ? "merchant_product_data_rejected" : "merchant_sync_retry",
        message: String(error?.response?.data?.error?.message || error?.message || "Sync failed").slice(0, 240) };
      retry = !invalidData;
    }

    await db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      const product = await tx.get(products.doc(id));
      const data = current.data();
      if (!current.exists || data.leaseToken !== token) return;
      if (data.version !== job.version) {
        tx.update(ref, { leaseToken: "", leaseUntil: 0 });
        return;
      }
      tx.update(ref, {
        status: retry ? "pending" : "done", leaseToken: "", leaseUntil: 0,
        attempts: (data.attempts || 0) + 1,
        nextAttemptAt: now() + retryMs * (result.status === "retrying" ? Math.min(2 ** (data.attempts || 0), 10) : 1),
        lastRebuildAt,
        submittedAt,
      });
      if (product.exists && getProductPublicationVersion(product.data()) === job.version) {
        tx.update(products.doc(id), {
          merchantSyncState: {
            status: result.status, version: job.version, checkedAt: now(),
            reason: result.reason || "", message: result.message || "",
          },
        });
      }
    });
    return result;
  }

  async function sync(product) {
    if (!await enqueue(product)) return { status: "skipped", offerId: product.id, reason: "product_deleted" };
    return process(product.id);
  }

  async function queue(product) {
    const exists = await enqueue(product);
    return { status: exists ? "queued" : "skipped", offerId: product.id,
      productName: product.name || "", reason: exists ? "waiting_for_published_page" : "product_deleted" };
  }

  async function drain() {
    if (draining) return;
    draining = true;
    try {
      const pending = await jobs.where("status", "==", "pending").get();
      // Query all pending jobs before filtering so one delayed job cannot
      // starve another. Process sequentially to bound outbound requests.
      for (const doc of pending.docs) {
        if ((doc.data().nextAttemptAt || 0) <= now()) await process(doc.id);
      }
    } finally { draining = false; }
  }

  return { sync, queue, drain, process };
}
