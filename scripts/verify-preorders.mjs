import assert from "node:assert/strict";
import { validatePreorderDetails } from "../Backend/services/preorderDetails.js";
import { createPreorderHandler } from "../Backend/services/preorderRequests.js";

const saved = [];
const products = {
  voice: { name: "Voice Mask Maker", productUrl: "voice-face-mask-maker", inStock: false, isActive: true, variants: [{ id: "white", label: "White" }] },
  nonvoice: { name: "Non-Voice Mask Maker", productUrl: "non-voice-face-mask-maker", inStock: false, isActive: true },
  dryer: { name: "Hair dryer", productUrl: "leafless-hair-dryer", isActive: true },
};
let failSave = false;
const db = { collection(name) {
  if (name === "products") return { doc: (id) => ({ get: async () => ({ exists: Boolean(products[id]), data: () => products[id] }) }) };
  assert.equal(name, "preorders");
  return { add: async (data) => { if (failSave) throw new Error("Simulated storage failure"); saved.push(data); return { id: `request-${saved.length}` }; } };
} };
const handler = createPreorderHandler(db);
const invoke = async (body) => {
  const result = { code: 200, payload: null };
  const response = { status(code) { result.code = code; return this; }, json(payload) { result.payload = payload; return this; } };
  await handler({ body }, response);
  return result;
};
const valid = { productId: "voice", variantId: "white", name: "  Demo  Customer  ", phone: "+91 98765 43210", address: "Test address" };
assert.equal(validatePreorderDetails({}).valid, false);
assert.equal(validatePreorderDetails({ name: "Demo", phone: "abc9876543210" }).valid, false);
assert.equal((await invoke({ ...valid, name: "" })).code, 400);
assert.equal((await invoke({ ...valid, phone: "" })).code, 400);
assert.equal((await invoke({ ...valid, phone: "123" })).code, 400);
assert.equal((await invoke({ ...valid, address: "x".repeat(501) })).code, 400);
assert.equal((await invoke({ ...valid, productId: "missing" })).code, 404);
assert.equal((await invoke({ ...valid, productId: "dryer", variantId: null })).code, 400);
assert.equal((await invoke({ ...valid, variantId: "invalid" })).code, 400);
assert.equal(saved.length, 0);
const success = await invoke({ ...valid, productName: "Spoofed product", variantName: "Spoofed variant" });
assert.equal(success.code, 201);
assert.equal(success.payload.success, true);
assert.equal(saved[0].name, "Demo Customer");
assert.equal(saved[0].phone, "919876543210");
assert.equal(saved[0].address, "Test address");
assert.equal(saved[0].email, null);
assert.equal(saved[0].contactMethod, "address");
assert.equal(saved[0].productName, "Voice Mask Maker");
assert.equal(saved[0].variantName, "White");
assert.equal(saved[0].requestType, "preorder");
assert.equal(saved[0].status, "pending");
assert(saved[0].createdAt instanceof Date);
assert.equal((await invoke({ ...valid, productId: "nonvoice", variantId: null, address: "" })).code, 201);
assert.equal((await invoke({ ...valid, contactMethod: "email", email: "invalid" })).code, 400);
assert.equal((await invoke({ ...valid, contactMethod: "other" })).code, 400);
assert.equal((await invoke({ ...valid, contactMethod: "email", email: " DEMO@EXAMPLE.COM " })).code, 201);
assert.equal(saved[2].email, "demo@example.com");
assert.equal(saved[2].address, "");
assert.equal(saved[2].phone, "919876543210");
assert.equal(saved[2].contactMethod, "email");
assert.equal((await invoke({ ...valid, contactMethod: "email", email: "" })).code, 201);
failSave = true;
const originalError = console.error;
console.error = () => {};
try { assert.equal((await invoke(valid)).code, 500); } finally { console.error = originalError; }
assert.equal(saved.length, 4);
console.log("Passed: mandatory name/phone, address-or-email choices, email validation and persistence, product/variant verification, optional details, and storage failures. No production data was written.");
