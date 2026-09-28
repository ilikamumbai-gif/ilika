import test from "node:test";
import assert from "node:assert/strict";
import { getCollagenPeptideOffer } from "./productOffers.js";
import { buildCartProductSnapshot, getCartItemDisplayPricing } from "../../src/utils/productPricing.js";
import { getOrderConfirmationEmail } from "../emailTemplates/orderConfirmationEmail.js";

const product = {
  id: "peptide-pack",
  name: "Ilika Collagen Peptide | 8 Peptide Pack for Facial Mask Maker Machine",
  price: 399,
  compareAtPrice: 499,
};

test("one identical pack is free per paid pack, without changing selling price", () => {
  const item = buildCartProductSnapshot(product, { selectedPrice: product.price, selectedCompareAtPrice: product.compareAtPrice });
  for (const quantity of [1, 2, 3, 2, 1]) {
    const offer = getCollagenPeptideOffer(item, quantity);
    assert.equal(offer.freeQuantity, quantity);
    assert.equal(offer.freeProductName, product.name);
    assert.equal(offer.freeUnitPrice, 0);
    assert.equal(getCartItemDisplayPricing(item).price * quantity, 399 * quantity);
  }
});

test("excludes mask maker machines, other products and combos", () => {
  for (const name of [
    "Ilika Voice Face Mask Maker Machine with Collagen Peptide",
    "Ilika Non-Voice Face Mask Maker Machine with Collagen Peptide",
    "Hydration + Glow Combo",
    "Ilika Facial Serum",
  ]) assert.equal(getCollagenPeptideOffer({ name }), null);
  assert.equal(getCollagenPeptideOffer({ ...product, isCombo: true }), null);
  assert.equal(getCollagenPeptideOffer({}), null);
});

test("supports product slug and retains offer through order serialization", () => {
  assert.ok(getCollagenPeptideOffer({ slug: "ilika-collagen-peptide-8-peptide-pack" }));
  const orderItem = JSON.parse(JSON.stringify({ ...product, quantity: 2, bogoOffer: getCollagenPeptideOffer(product, 2) }));
  assert.equal(orderItem.bogoOffer.freeQuantity, 2);
  const email = getOrderConfirmationEmail({ items: [orderItem], totalAmount: 798 });
  assert.match(email.html, /2 additional free packs \(Rs 0\)/);
  assert.match(email.html, /Rs 798\.00/);
});
