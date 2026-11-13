import test from "node:test";
import assert from "node:assert/strict";
import { createProductMerchantSync } from "./productMerchantSync.js";
import { getProductPublicationMarker } from "../../src/utils/productPublication.js";

const initial = { id: "maker", productUrl: "mask-maker", inStock: false, updatedAt: 2 };
function fixture() {
  const records = new Map([["products/maker", structuredClone(initial)]]);
  const snapshot = (ref) => ({
    id: ref.id, exists: records.has(ref.path),
    data: () => structuredClone(records.get(ref.path)),
  });
  const doc = (path) => ({
    path, id: path.split("/").at(-1), get: async () => snapshot(doc(path)),
    update: async (data) => records.set(path, { ...records.get(path), ...structuredClone(data) }),
  });
  let tail = Promise.resolve();
  const db = {
    collection: (name) => ({
      doc: (id) => doc(`${name}/${id}`),
      where: (field, _op, value) => ({ get: async () => ({ docs: [...records]
        .filter(([key, data]) => key.startsWith(`${name}/`) && data[field] === value)
        .map(([key]) => snapshot(doc(key))) }) }),
    }),
    runTransaction: (callback) => {
      const result = tail.then(() => callback({
        get: async (ref) => snapshot(ref),
        set: (ref, data) => records.set(ref.path, structuredClone(data)),
        update: (ref, data) => records.set(ref.path, { ...records.get(ref.path), ...structuredClone(data) }),
      }));
      tail = result.catch(() => {});
      return result;
    },
  };
  let time = 1000000;
  const submitted = [];
  const rebuilds = [];
  const control = { page: { ...initial, updatedAt: 1 }, failures: 0, onFetch: null };
  const options = {
    db, siteBaseUrl: "https://ilika.in", productPath: (product) => product.productUrl ? `/product/${product.productUrl}` : "",
    now: () => time, retryMs: 30, rebuildRetryMs: 300,
    requestRebuild: async (input) => { rebuilds.push(input); return { status: "triggered" }; },
    fetchImpl: async () => {
      if (control.onFetch) await control.onFetch();
      return { ok: true, text: async () => `<main ${getProductPublicationMarker(control.page)}></main>` };
    },
    submit: async (product) => {
      if (control.failures-- > 0) throw new Error("Google temporarily unavailable");
      submitted.push(structuredClone(product));
      return { status: product.isActive === false ? "deleted" : !product.productUrl ? "skipped" : "upserted" };
    },
  };
  return { records, options, submitted, rebuilds, control, advance: (ms = 31) => { time += ms; }, service: createProductMerchantSync(options) };
}

test("out-of-stock and restock saves submit only after their matching page is published", async () => {
  const f = fixture();
  assert.equal((await f.service.sync(initial)).status, "queued");
  assert.equal(f.submitted.length, 0);
  f.control.page = initial;
  f.advance();
  await f.service.drain();
  assert.deepEqual(f.submitted.map((p) => p.inStock), [false]);
  const restocked = { ...initial, inStock: true, updatedAt: 3 };
  f.records.set("products/maker", restocked);
  assert.equal((await f.service.sync(restocked)).status, "queued");
  f.control.page = restocked;
  f.advance();
  await f.service.drain();
  assert.deepEqual(f.submitted.map((p) => p.inStock), [false, true]);
  assert.equal(f.records.get("products/maker").merchantSyncState.status, "upserted");
});

test("a failed Merchant request survives a backend restart and retries automatically", async () => {
  const f = fixture();
  f.control.page = initial;
  f.control.failures = 1;
  assert.equal((await f.service.sync(initial)).status, "retrying");
  assert.equal(f.records.get("merchantSyncJobs/maker").status, "pending");
  assert.equal(f.records.get("products/maker").merchantSyncState.status, "retrying");
  f.advance();
  const restarted = createProductMerchantSync(f.options);
  await restarted.drain();
  assert.equal(f.submitted.length, 1);
  assert.equal(f.records.get("merchantSyncJobs/maker").status, "done");
});

test("a newer admin save supersedes the snapshot being checked without losing its job", async () => {
  const f = fixture();
  const newer = { ...initial, inStock: true, updatedAt: 3 };
  f.control.page = initial;
  f.control.onFetch = async () => {
    f.control.onFetch = null;
    f.records.set("products/maker", newer);
    assert.equal((await f.service.sync(newer)).status, "queued");
  };
  assert.equal((await f.service.sync(initial)).status, "queued");
  assert.equal(f.submitted.length, 0);
  assert.equal(f.records.get("merchantSyncJobs/maker").version, "3");
  f.control.page = newer;
  f.advance();
  await f.service.drain();
  assert.deepEqual(f.submitted.map((p) => p.updatedAt), [3]);
});

test("two backend instances cannot submit the same pending job simultaneously", async () => {
  const f = fixture();
  f.control.page = initial;
  let release;
  let started;
  const fetchStarted = new Promise((resolve) => { started = resolve; });
  f.control.onFetch = () => { started(); return new Promise((resolve) => { release = resolve; }); };
  const first = f.service.sync(initial);
  await fetchStarted;
  const other = createProductMerchantSync(f.options);
  assert.equal((await other.process("maker")).status, "queued");
  release();
  await first;
  assert.equal(f.submitted.length, 1);
});

test("inactive products are removed without waiting for a public page", async () => {
  const f = fixture();
  const inactive = { ...initial, isActive: false };
  f.records.set("products/maker", inactive);
  f.control.onFetch = () => { throw new Error("Should not fetch inactive page"); };
  assert.equal((await f.service.sync(inactive)).status, "deleted");
  assert.equal(f.submitted.length, 1);
});

test("a product deleted while queued is not recreated in Merchant Center", async () => {
  const f = fixture();
  await f.service.sync(initial);
  f.records.delete("products/maker");
  f.advance();
  await f.service.drain();
  assert.equal(f.submitted.length, 0);
  assert.equal(f.records.get("merchantSyncJobs/maker").status, "done");
});

test("a stale deployment requests another rebuild with a backoff", async () => {
  const f = fixture();
  await f.service.sync(initial);
  f.advance(301);
  await f.service.drain();
  assert.equal(f.rebuilds.length, 1);
  f.advance();
  await f.service.drain();
  assert.equal(f.rebuilds.length, 1);
});

test("bulk sync cannot replace a new save with an older catalog snapshot", async () => {
  const f = fixture();
  const newer = { ...initial, inStock: true, updatedAt: 3 };
  f.records.set("products/maker", newer);
  f.control.page = newer;
  await f.service.queue(initial);
  await f.service.drain();
  assert.equal(f.submitted.length, 1);
  assert.equal(f.submitted[0].updatedAt, 3);
});

test("submission is not confirmation: poll Google's processed stock and only then finish", async () => {
  const f = fixture();
  f.control.page = initial;
  let googleMatches = false;
  const service = createProductMerchantSync({ ...f.options, verify: async () => googleMatches });
  assert.equal((await service.sync(initial)).status, "upserted");
  assert.equal(f.records.get("merchantSyncJobs/maker").status, "pending");
  f.advance();
  await service.drain();
  assert.equal(f.submitted.length, 1, "do not repeatedly submit while Google is processing");
  assert.equal(f.records.get("products/maker").merchantSyncState.status, "upserted");
  googleMatches = true;
  f.advance();
  await service.drain();
  assert.equal(f.records.get("products/maker").merchantSyncState.status, "confirmed");
  assert.equal(f.records.get("merchantSyncJobs/maker").status, "done");
});

test("a persistent Google availability override is resubmitted with a backoff", async () => {
  const f = fixture();
  f.control.page = initial;
  const service = createProductMerchantSync({ ...f.options, verify: async () => false });
  await service.sync(initial);
  f.advance(301);
  await service.drain();
  assert.equal(f.submitted.length, 2);
  assert.equal(f.records.get("merchantSyncJobs/maker").status, "pending");
});

test("Google rejects invalid data visibly instead of promising a temporary retry", async () => {
  const f = fixture();
  f.control.page = initial;
  const service = createProductMerchantSync({ ...f.options, submit: async () => {
    throw Object.assign(new Error("Invalid product attribute"), { response: { status: 400 } });
  } });
  const result = await service.sync(initial);
  assert.equal(result.status, "error");
  assert.equal(f.records.get("products/maker").merchantSyncState.message, "Invalid product attribute");
  assert.equal(f.records.get("merchantSyncJobs/maker").status, "done");
});
