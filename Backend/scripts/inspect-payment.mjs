// Read-only payment/order diagnostic. Never prints credentials or customer details.
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });
const paymentId = process.argv[2];
if (!/^pay_[A-Za-z0-9]+$/.test(paymentId || "")) throw new Error("Pass a Razorpay payment ID");
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) throw new Error("Razorpay credentials are not configured");
const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
  headers: { Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}` },
  signal: AbortSignal.timeout(15000),
});
const payment = await response.json();
if (!response.ok) {
  console.log(JSON.stringify({ httpStatus: response.status, error: payment.error?.description || "Payment lookup failed" }));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ paymentId: payment.id, orderId: payment.order_id, status: payment.status, amount: payment.amount / 100, currency: payment.currency, createdAt: new Date(payment.created_at * 1000).toISOString(), captured: payment.captured }));
}
if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
  const app = admin.initializeApp({ credential: admin.credential.cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") }) });
  try {
    const orders = await admin.firestore().collection("orders").where("razorpay_payment_id", "==", paymentId).get();
    console.log(JSON.stringify({ savedOrders: orders.docs.map((doc) => { const data = doc.data(); return { id: doc.id, paymentStatus: data.paymentStatus, amount: data.totalAmount, products: (data.items || []).map((item) => item.name) }; }) }));
    const email = process.argv[3] || payment.email;
    if (email) {
      const users = await admin.firestore().collection("users").where("email", "==", email).get();
      for (const user of users.docs) {
        const addresses = await user.ref.collection("addresses").get();
        console.log(JSON.stringify({ savedAddressCount: addresses.size, addresses: addresses.docs.map((doc) => {
          const address = doc.data();
          return { id: doc.id, hasName: Boolean(address.name), hasAddress: Boolean(address.addressLine || address.address), hasCity: Boolean(address.city), hasState: Boolean(address.state), hasPincode: Boolean(address.pincode), matchesPaymentPhone: String(address.phone || "").replace(/\D/g, "").slice(-10) === String(payment.contact || "").replace(/\D/g, "").slice(-10) };
        }) }));
        const cart = await user.ref.collection("cart").get();
        console.log(JSON.stringify({ currentCart: cart.docs.map((doc) => {
          const item = doc.data();
          return { name: item.name, price: item.price, quantity: item.quantity, isCombo: Boolean(item.isCombo), baseProductId: item.baseProductId, components: (item.comboItems || []).map((sub) => sub.name) };
        }) }));
      }
      const otherOrders = await admin.firestore().collection("orders").where("userEmail", "==", email).get();
      console.log(JSON.stringify({ customerOrders: otherOrders.docs.map((doc) => {
        const item = doc.data();
        return { id: doc.id, amount: item.totalAmount, paymentId: item.razorpay_payment_id, paymentStatus: item.paymentStatus, createdAt: item.createdAt, products: (item.items || []).map((sub) => sub.name) };
      }) }));
    }
  } finally {
    await app.delete();
  }
}
