import test from "node:test";
import assert from "node:assert/strict";
import { getPrepaidDiscount } from "./prepaidDiscount.js";
import { isPrepaidOfferEligible } from "../../src/utils/productPricing.js";

test("Glow Therapy Combo gets the same discount during checkout and verification", () => {
  const combo = { name: "Glow Therapy Combo", isCombo: true, price: 3999, quantity: 1 };
  assert.equal(isPrepaidOfferEligible(combo), true);
  const expectedRazorpayAmount = 389900;
  assert.equal(Math.round((combo.price - getPrepaidDiscount([combo])) * 100), expectedRazorpayAmount);
});

test("eligible devices and mixed baskets receive only one order discount", () => {
  const items = [
    { name: "Voice Face Mask Maker", price: 4499, quantity: 2 },
    { name: "Glow Therapy Combo", isCombo: true, price: 3999, quantity: 1 },
    { name: "Face Serum", price: 1999, quantity: 1 },
  ];
  assert.equal(getPrepaidDiscount(items), 100);
});

test("combo plus collagen matches the captured 4298 rupee payment", () => {
  const items = [
    { name: "Glow Therapy Combo", isCombo: true, price: 3999, quantity: 1 },
    { name: "Ilika Collagen Peptide | 8 Peptide Pack for Facial Mask Maker Machine", price: 399, quantity: 1 },
  ];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  assert.equal(Math.round((subtotal - getPrepaidDiscount(items)) * 100), 429800);
});

test("excluded products, cheaper combos and empty carts receive no discount", () => {
  assert.equal(getPrepaidDiscount([]), 0);
  assert.equal(getPrepaidDiscount([{ name: "Premium Mask Duo + Hydra Gel", price: 699, quantity: 3 }]), 0);
  assert.equal(getPrepaidDiscount([{ name: "Face Serum", price: 1999, quantity: 1 }]), 0);
});
