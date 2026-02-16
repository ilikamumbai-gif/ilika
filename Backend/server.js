import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "./firebaseAdmin.js";

dotenv.config();

const app = express();

/* ==============================
   RAZORPAY CONFIG
============================== */

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ==============================
   CORS CONFIG (DEV + PROD)
============================== */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://ilika.vercel.app",
  process.env.FRONTEND_URL,
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());

/* ==============================
   HEALTH CHECK
============================== */

app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

/* ==============================
   USER ROUTES
============================== */

app.post("/api/users/login", async (req, res) => {
  try {
    const { uid, email, name } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: "Missing user data" });
    }

    const userRef = db.collection("users").doc(uid);
    const docSnap = await userRef.get();

    if (!docSnap.exists) {
      await userRef.set({
        uid,
        email,
        name: name || "",
        role: "user",
        createdAt: new Date(),
      });
    }

    res.json({ message: "User saved successfully" });

  } catch (error) {
    res.status(500).json({ error: "Failed to save user" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();

    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }));

    res.json(users);

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/* ==============================
   USER ADDRESS ROUTES
============================== */

app.post("/api/users/:uid/address", async (req, res) => {
  try {
    const { uid } = req.params;

    const docRef = await db
      .collection("users")
      .doc(uid)
      .collection("addresses")
      .add({
        ...req.body,
        createdAt: new Date(),
      });

    res.json({ id: docRef.id });

  } catch (error) {
    res.status(500).json({ error: "Failed to save address" });
  }
});

app.get("/api/users/:uid/address", async (req, res) => {
  try {
    const { uid } = req.params;

    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("addresses")
      .orderBy("createdAt", "desc")
      .get();

    const addresses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(addresses);

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

/* ==============================
   PRODUCT ROUTES
============================== */

app.post("/api/products", async (req, res) => {
  try {
    const docRef = await db.collection("products").add({
      ...req.body,
      createdAt: new Date(),
    });

    res.json({ id: docRef.id });

  } catch (error) {
    res.status(500).json({ error: "Failed to add product" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const snapshot = await db.collection("products").get();

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(products);

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/* ==============================
   CREATE RAZORPAY ORDER
============================== */

app.post("/api/payments/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json(order);

  } catch (error) {
    console.error("Razorpay create error:", error);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

/* ==============================
   VERIFY RAZORPAY PAYMENT
============================== */

app.post("/api/payments/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    const docRef = await db.collection("orders").add({
      ...orderData,
      paymentMethod: "ONLINE",
      paymentStatus: "Paid",
      status: "Placed",
      razorpayPaymentId: razorpay_payment_id,
      createdAt: new Date(),
    });

    res.json({
      message: "Payment verified & order saved",
      orderId: docRef.id,
    });

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

/* ==============================
   ORDER ROUTES (COD)
============================== */

app.post("/api/orders", async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      items,
      shippingAddressId,
      paymentMethod,
    } = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    const addressDoc = await db
      .collection("users")
      .doc(userId)
      .collection("addresses")
      .doc(shippingAddressId)
      .get();

    if (!addressDoc.exists) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const shippingAddress = addressDoc.data();

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const productDoc = await db.collection("products").doc(item.id).get();

      if (!productDoc.exists) {
        return res.status(400).json({ error: "Product not found" });
      }

      const productData = productDoc.data();
      const quantity = item.quantity || 1;
      const price = Number(productData.price);

      totalAmount += price * quantity;

      validatedItems.push({
        productId: item.id,
        name: productData.name,
        price,
        quantity,
        image: productData.imageUrl || "",
      });
    }

    const docRef = await db.collection("orders").add({
      userId,
      userEmail,
      items: validatedItems,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "Unpaid",
      status: "Placed",
      createdAt: new Date(),
    });

    res.json({
      message: "Order placed successfully",
      orderId: docRef.id,
    });

  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({ error: "Failed to place order" });
  }
});

/* ==============================
   FETCH ORDERS
============================== */

app.get("/api/orders", async (req, res) => {
  try {
    const snapshot = await db
      .collection("orders")
      .orderBy("createdAt", "desc")
      .get();

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(orders);

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/* ==============================
   START SERVER
============================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
