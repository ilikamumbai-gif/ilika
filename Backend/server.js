import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "./firebaseAdmin.js";

dotenv.config();
const app = express();

/* ============================== RAZORPAY ============================== */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ============================== CORS ============================== */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://ilika.vercel.app",
  process.env.FRONTEND_URL,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());

/* ============================== HEALTH ============================== */
app.get("/", (req, res) => res.send("Backend Running 🚀"));

/* ============================== USERS ============================== */
app.post("/api/users/login", async (req, res) => {
  try {
    const { uid, email, name } = req.body;
    if (!uid || !email) return res.status(400).json({ error: "Missing user data" });

    const userRef = db.collection("users").doc(uid);
    const docSnap = await userRef.get();

    if (!docSnap.exists) {
      await userRef.set({ uid, email, name: name || "", role: "user", createdAt: new Date() });
    }

    res.json({ message: "User saved successfully" });
  } catch {
    res.status(500).json({ error: "Failed to save user" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    res.json(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.put("/api/users/:uid", async (req, res) => {
  try {
    await db.collection("users").doc(req.params.uid).update(req.body);
    res.json({ message: "Profile updated" });
  } catch {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/* ============================== ADDRESSES ============================== */
app.post("/api/users/:uid/address", async (req, res) => {
  try {
    const docRef = await db.collection("users").doc(req.params.uid).collection("addresses").add({
      ...req.body,
      createdAt: new Date(),
    });
    res.json({ id: docRef.id });
  } catch {
    res.status(500).json({ error: "Failed to save address" });
  }
});

app.get("/api/users/:uid/address", async (req, res) => {
  try {
    const snapshot = await db.collection("users").doc(req.params.uid).collection("addresses")
      .orderBy("createdAt", "desc").get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch {
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

app.put("/api/users/:uid/address/:addressId", async (req, res) => {
  try {
    await db.collection("users").doc(req.params.uid).collection("addresses")
      .doc(req.params.addressId).update(req.body);
    res.json({ message: "Address updated" });
  } catch {
    res.status(500).json({ error: "Failed to update address" });
  }
});

/* ============================== PRODUCTS ============================== */
app.post("/api/products", async (req, res) => {
  try {
    const docRef = await db.collection("products").add({ ...req.body, createdAt: new Date() });
    res.json({ id: docRef.id, ...req.body });
  } catch {
    res.status(500).json({ error: "Failed to add product" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const snapshot = await db.collection("products").get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const doc = await db.collection("products").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Product not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    await db.collection("products").doc(req.params.id).update({ ...req.body, updatedAt: new Date() });
    res.json({ message: "Product updated successfully" });
  } catch {
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await db.collection("products").doc(req.params.id).delete();
    res.json({ message: "Product deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete product" });
  }
});
/* ============================== PAYMENTS ============================== */

app.post("/api/payments/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const options = {
      amount: amount * 100, // Razorpay uses paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });

  } catch (error) {
    console.error("Razorpay error:", error);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

/* ============================== ORDERS ============================== */
app.post("/api/orders", async (req, res) => {
  try {
    const { userId, userEmail, items, shippingAddressId } = req.body;
    if (!userId || !items?.length) return res.status(400).json({ error: "Invalid order data" });

    const addressDoc = await db.collection("users").doc(userId).collection("addresses").doc(shippingAddressId).get();
    if (!addressDoc.exists) return res.status(400).json({ error: "Invalid address" });

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const productDoc = await db.collection("products").doc(item.id).get();
      const productData = productDoc.data();
      const quantity = item.quantity || 1;
      totalAmount += Number(productData.price) * quantity;

      validatedItems.push({
        productId: item.id,
        name: productData.name,
        price: productData.price,
        quantity,
      });
    }

    const docRef = await db.collection("orders").add({
      userId,
      userEmail,
      items: validatedItems,
      totalAmount,
      shippingAddress: addressDoc.data(),
      status: "Placed",
      paymentStatus: "Unpaid",
      createdAt: new Date(),
    });

    res.json({ orderId: docRef.id });
  } catch {
    res.status(500).json({ error: "Failed to place order" });
  }
});

app.get("/api/orders", async (req, res) => {
  const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

app.get("/api/users/:uid/orders", async (req, res) => {
  try {
    const snapshot = await db.collection("orders")
      .where("userId", "==", req.params.uid)
      .get();

    let orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort manually (latest first)
    orders.sort((a, b) => {
      const aTime = a.createdAt?._seconds || new Date(a.createdAt).getTime() || 0;
      const bTime = b.createdAt?._seconds || new Date(b.createdAt).getTime() || 0;
      return bTime - aTime;
    });

    res.json(orders);

  } catch (error) {
    console.error("USER ORDER FETCH ERROR:", error);
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
});

/* ============================== UPDATE ORDER STATUS ============================== */
/* ============================== UPDATE ORDER STATUS ============================== */
app.put("/api/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    await db.collection("orders")
      .doc(req.params.id)
      .update({
        status,
        updatedAt: new Date(),
      });

    res.json({ message: "Order status updated successfully" });

  } catch (error) {
    console.error("STATUS UPDATE ERROR:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});


/* ============================== CATEGORIES ============================== */
app.post("/api/categories", async (req, res) => {
  const docRef = await db.collection("categories").add({ ...req.body, createdAt: new Date() });
  res.json({ id: docRef.id, ...req.body });
});

app.get("/api/categories", async (req, res) => {
  const snapshot = await db.collection("categories").get();
  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

app.put("/api/categories/:id", async (req, res) => {
  await db.collection("categories").doc(req.params.id).update(req.body);
  res.json({ message: "Category updated successfully" });
});

app.delete("/api/categories/:id", async (req, res) => {
  await db.collection("categories").doc(req.params.id).delete();
  res.json({ message: "Category deleted successfully" });
});
/* ============================== VERIFY PAYMENT ============================== */

app.post("/api/payments/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment data" });
    }

    // create signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // verify
    if (expectedSignature === razorpay_signature) {

      // update order payment status in firestore
      if (orderId) {
        await db.collection("orders").doc(orderId).update({
          paymentStatus: "Paid",
          razorpay_payment_id,
          paidAt: new Date(),
        });
      }

      return res.json({
        success: true,
        message: "Payment verified successfully"
      });

    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid signature"
      });
    }

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
});


/* ============================== START ============================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
