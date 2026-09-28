// One-payment recovery. Dry run by default; --apply saves without sending emails.
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import admin from "firebase-admin";
import { getPrepaidDiscount } from "../services/prepaidDiscount.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });
const paymentId = "pay_ThMv3V4HOrPnyj";
const customerEmail = "ankitathakkar2612@gmail.com";
const app = admin.initializeApp({ credential: admin.credential.cert({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
}) });
const db = admin.firestore();
const normalizePhone = (value) => String(value || "").replace(/\D/g, "").slice(-10);
const readRazorpay = async (path) => {
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}` },
    signal: AbortSignal.timeout(15000),
  });
  assert.ok(response.ok, `Razorpay lookup failed: ${response.status}`);
  return response.json();
};

try {
  const payment = await readRazorpay(`payments/${paymentId}`);
  assert.equal(payment.status, "captured");
  assert.equal(payment.captured, true);
  assert.equal(payment.currency, "INR");
  assert.equal(payment.amount, 429800);
  assert.equal(Number(payment.amount_refunded || 0), 0);
  assert.equal(normalizePhone(payment.contact), "8160593405");
  assert.equal(payment.order_id, "order_ThMtSUMPtnjyub");
  const gatewayOrder = await readRazorpay(`orders/${payment.order_id}`);
  assert.equal(gatewayOrder.status, "paid");
  assert.equal(gatewayOrder.amount_paid, payment.amount);

  const result = await db.runTransaction(async (transaction) => {
    const duplicate = await transaction.get(db.collection("orders").where("razorpay_payment_id", "==", paymentId));
    if (!duplicate.empty) return { status: "already_saved", orderId: duplicate.docs[0].id };
    const sameGatewayOrder = await transaction.get(db.collection("orders").where("razorpay_order_id", "==", payment.order_id));
    assert.ok(sameGatewayOrder.empty, "Gateway order already has a saved order");
    const users = await transaction.get(db.collection("users").where("email", "==", customerEmail));
    assert.equal(users.size, 1, "Expected exactly one customer");
    const user = users.docs[0];
    const cart = await transaction.get(user.ref.collection("cart"));
    const addresses = await transaction.get(user.ref.collection("addresses"));
    assert.equal(addresses.size, 1, "Delivery address is ambiguous; manual confirmation required");
    const address = addresses.docs[0].data();
    assert.equal(normalizePhone(address.phone), normalizePhone(payment.contact));
    assert.ok(address.name && (address.addressLine || address.address) && address.city && address.state && address.pincode, "Incomplete delivery address");
    const shippingAddress = { name: address.name, phone: address.phone, addressLine: address.addressLine || address.address, city: address.city, state: address.state, pincode: address.pincode };
    const items = cart.docs.map((doc) => {
      const item = doc.data();
      return {
        productId: item.baseProductId || doc.id,
        baseProductId: item.baseProductId || doc.id,
        cartItemId: doc.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: item.image || item.images?.[0] || "",
        isCombo: Boolean(item.isCombo),
        comboItems: item.comboItems || [],
        variantId: item.variantId || null,
        variantName: item.variantName || null,
        selectedAddOn: item.selectedAddOn || null,
        compareAtPrice: item.compareAtPrice || null,
      };
    });
    assert.equal(items.length, 2, "Customer cart has changed");
    assert.ok(items.some((item) => item.baseProductId === "glow-therapy-comb" && item.price === 3999 && item.quantity === 1));
    assert.ok(items.some((item) => item.baseProductId === "FJQEHqnEypDccD1Z7soy" && item.price === 399 && item.quantity === 1));
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = getPrepaidDiscount(items);
    assert.equal(Math.round((subtotal - discount) * 100), payment.amount);
    const paidAt = new Date(payment.created_at * 1000);
    const payload = {
      userId: user.id, userEmail: customerEmail, items,
      totalAmount: payment.amount / 100, originalSubtotal: subtotal, discountAmount: discount,
      shippingAddress,
      giftOrder: { isGiftOrder: false, wantsGiftWrap: false, giftWrapFee: 0, buyerAddress: shippingAddress, recipientAddress: null },
      status: "Placed", paymentStatus: "Paid", paymentMethod: "ONLINE", source: "WEBSITE",
      razorpay_payment_id: paymentId, razorpay_order_id: payment.order_id,
      paidAt, createdAt: paidAt,
      tracking: { trackingId: "", courierName: "", trackingUrl: "", shippingStatus: "Processing" },
      emailStatus: { orderConfirmation: { sent: false, sentAt: null } },
      recovery: { recoveredAt: new Date(), reason: "Combo prepaid discount mismatch", itemsSource: "Customer saved cart, matched to captured payment total", addressSource: "Only saved customer address; phone matches payment", shippingAddressId: addresses.docs[0].id },
    };
    const preview = { paymentId, amount: payload.totalAmount, paymentStatus: payload.paymentStatus, products: items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })), discount, addressVerified: true };
    if (!process.argv.includes("--apply")) return { status: "dry_run", ...preview };
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(paidAt);
    const dateStamp = ["year", "month", "day"].map((type) => parts.find((part) => part.type === type).value).join("");
    const counterRef = db.collection("meta").doc("orderCounters").collection("daily").doc(dateStamp);
    const counter = await transaction.get(counterRef);
    let sequence = Number(counter.data()?.lastSeq || 0);
    for (let attempt = 0; attempt < 20; attempt++) {
      sequence++;
      const orderId = `ORD-${dateStamp}-${String(sequence).padStart(4, "0")}`;
      const orderRef = db.collection("orders").doc(orderId);
      const existing = await transaction.get(orderRef);
      if (existing.exists) continue;
      transaction.create(orderRef, payload);
      transaction.set(counterRef, { lastSeq: sequence, updatedAt: new Date() }, { merge: true });
      return { status: "saved", orderId, ...preview };
    }
    throw new Error("Unable to allocate order ID");
  });
  console.log(JSON.stringify(result));
  if (result.orderId) {
    const saved = await db.collection("orders").doc(result.orderId).get();
    assert.equal(saved.data()?.razorpay_payment_id, paymentId);
    assert.equal(saved.data()?.paymentStatus, "Paid");
    assert.equal(saved.data()?.totalAmount, 4298);
    assert.ok(saved.data()?.createdAt, "Admin listing requires createdAt");
    console.log(JSON.stringify({ verified: true, orderId: saved.id }));
  }
} finally {
  await app.delete();
}
