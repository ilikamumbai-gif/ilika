import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const requiredEnv = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(
    `[migrate-product-urls] Missing Firebase env vars: ${missingEnv.join(", ")}`
  );
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: String(process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();
const productsRef = db.collection("products");
const shouldCommit = process.argv.includes("--commit");

const slugify = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const uniqueList = (...groups) => {
  const values = new Set();
  groups.flat().forEach((value) => {
    const normalized = slugify(value);
    if (normalized) values.add(normalized);
  });
  return Array.from(values);
};

const hasNonEmptyProductUrl = (value) => Boolean(slugify(value));

const printSummary = (summary) => {
  console.log("\n[migrate-product-urls] Migration summary");
  console.log(`1. Total products checked: ${summary.totalChecked}`);
  console.log(`2. productUrl added: ${summary.productUrlAdded}`);
  console.log(`3. duplicates fixed: ${summary.duplicatesFixed}`);
  console.log(`4. skipped products: ${summary.skippedProducts}`);
  console.log(`5. errors: ${summary.errors}`);
};

const flushBatch = async (updates, summary) => {
  if (!updates.length) return;
  if (!shouldCommit) {
    updates.length = 0;
    return;
  }

  const batch = db.batch();
  updates.forEach(({ ref, data }) => batch.update(ref, data));
  await batch.commit();
  updates.length = 0;
  summary.batchesCommitted += 1;
};

const main = async () => {
  const snapshot = await productsRef.get();
  const docs = snapshot.docs;

  const summary = {
    totalChecked: docs.length,
    productUrlAdded: 0,
    duplicatesFixed: 0,
    skippedProducts: 0,
    errors: 0,
    batchesCommitted: 0,
  };

  const urlOwners = new Map();

  const registerUrl = (url, docId) => {
    const normalized = slugify(url);
    if (!normalized) return;
    const owners = urlOwners.get(normalized) || new Set();
    owners.add(docId);
    urlOwners.set(normalized, owners);
  };

  const isTakenByAnotherProduct = (url, docId) => {
    const normalized = slugify(url);
    if (!normalized) return false;
    const owners = urlOwners.get(normalized);
    if (!owners || !owners.size) return false;
    return Array.from(owners).some((ownerId) => ownerId !== docId);
  };

  docs.forEach((doc) => {
    const data = doc.data() || {};
    const productUrl = slugify(data.productUrl || "");
    const legacySlug = slugify(data.slug || "");
    const oldUrls = Array.isArray(data.oldUrls) ? data.oldUrls : [];

    if (productUrl) registerUrl(productUrl, doc.id);
    else if (legacySlug) registerUrl(legacySlug, doc.id);

    uniqueList(oldUrls).forEach((oldUrl) => registerUrl(oldUrl, doc.id));
  });

  const pendingUpdates = [];

  for (const doc of docs) {
    try {
      const data = doc.data() || {};
      const rawName = String(data.name || "").trim();
      const currentProductUrl = slugify(data.productUrl || "");
      const currentLegacySlug = slugify(data.slug || "");
      const existingOldUrls = Array.isArray(data.oldUrls) ? data.oldUrls : [];
      const normalizedOldUrls = uniqueList(existingOldUrls);
      const updatePayload = {};

      if (!Array.isArray(data.oldUrls)) {
        updatePayload.oldUrls = [];
      } else if (normalizedOldUrls.length !== existingOldUrls.length) {
        updatePayload.oldUrls = normalizedOldUrls;
      }

      if (!hasNonEmptyProductUrl(currentProductUrl)) {
        const baseSlug = slugify(rawName || currentLegacySlug || doc.id);
        if (!baseSlug) {
          summary.errors += 1;
          console.error(
            `[migrate-product-urls] Could not generate productUrl for doc ${doc.id}`
          );
          continue;
        }

        let nextProductUrl = baseSlug;
        let suffix = 2;
        while (isTakenByAnotherProduct(nextProductUrl, doc.id)) {
          nextProductUrl = `${baseSlug}-${suffix}`;
          suffix += 1;
        }

        updatePayload.productUrl = nextProductUrl;
        registerUrl(nextProductUrl, doc.id);
        summary.productUrlAdded += 1;
        if (nextProductUrl !== baseSlug) summary.duplicatesFixed += 1;
      }

      if (!Object.keys(updatePayload).length) {
        summary.skippedProducts += 1;
        continue;
      }

      pendingUpdates.push({ ref: doc.ref, data: updatePayload });
      if (pendingUpdates.length >= 400) {
        await flushBatch(pendingUpdates, summary);
      }
    } catch (error) {
      summary.errors += 1;
      console.error(
        `[migrate-product-urls] Failed for doc ${doc.id}: ${error?.message || error}`
      );
    }
  }

  await flushBatch(pendingUpdates, summary);

  console.log(
    `[migrate-product-urls] Mode: ${shouldCommit ? "COMMIT" : "DRY RUN"}`
  );
  if (!shouldCommit) {
    console.log(
      "[migrate-product-urls] Dry run only. Re-run with --commit to write changes."
    );
  } else {
    console.log(
      `[migrate-product-urls] Batch commits completed: ${summary.batchesCommitted}`
    );
  }

  printSummary(summary);
};

main()
  .catch((error) => {
    console.error("[migrate-product-urls] Failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await admin.app().delete().catch(() => {});
  });
