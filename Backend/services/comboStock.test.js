import test from "node:test";
import assert from "node:assert/strict";
import { getComboStockError } from "./comboStock.js";

const inventory = (products) => ({
  collection: () => ({
    doc: (id) => ({ get: async () => ({ exists: !!products[id], data: () => products[id] }) }),
    where: (field, operator, value) => ({ limit: () => ({ get: async () => {
      const matches = Object.values(products).filter((product) => product[field] === value);
      return { empty: !matches.length, docs: matches.map((product) => ({ data: () => product })) };
    } }) }),
  }),
});

test("rejects a combo when its mask maker sells out after adding to cart", async () => {
  const db = inventory({ maker: { name: "Non-voice mask maker", inStock: false }, serum: { inStock: true } });
  assert.match(await getComboStockError(db, [{ id: "maker" }, { id: "serum" }]), /out of stock/);
});
test("validates free products using their product ID", async () => {
  const components = [{ id: "free-mask-random", productId: "serum" }];
  assert.equal(await getComboStockError(inventory({ serum: { inStock: true } }), components), null);
  assert.match(await getComboStockError(inventory({ serum: { name: "Serum", inStock: false } }), components), /out of stock/);
});
test("rejects empty, missing and inactive components", async () => {
  const db = inventory({ inactive: { name: "Mask", isActive: false } });
  for (const components of [[], [{ id: "missing" }], [{ id: "inactive" }]]) {
    assert.match(await getComboStockError(db, components), /unavailable/);
  }
});
test("accepts available components and legacy IDs", async () => {
  const db = inventory({ maker: { _id: "legacy", inStock: true }, serum: { inStock: true } });
  assert.equal(await getComboStockError(db, [{ id: "legacy" }, { id: "serum" }]), null);
});
