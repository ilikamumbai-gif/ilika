import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./firebaseAdmin.js";

dotenv.config();

const app = express();

/* ==============================
   CORS CONFIG (DEV + PROD)
============================== */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL, // production frontend URL
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
   SAVE USER ON LOGIN
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
      console.log(`✅ New user created: ${email}`);
    }

    res.json({ message: "User saved successfully" });

  } catch (error) {
    console.error("❌ Error saving user:", error);
    res.status(500).json({ error: "Failed to save user" });
  }
});

/* ==============================
   GET ALL USERS (ADMIN)
============================== */
app.get("/api/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();

    const users = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));

    res.json(users);

  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/* ==============================
   PRODUCTS ROUTES
============================== */

app.post("/api/products", async (req, res) => {
  try {
    const docRef = await db.collection("products").add({
      ...req.body,
      createdAt: new Date(),
    });

    res.json({ id: docRef.id, ...req.body });

  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const snapshot = await db.collection("products").get();

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(products);

  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const doc = await db.collection("products")
      .doc(req.params.id)
      .get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ id: doc.id, ...doc.data() });

  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    await db.collection("products")
      .doc(req.params.id)
      .update(req.body);

    res.json({ message: "Product updated successfully" });

  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await db.collection("products")
      .doc(req.params.id)
      .delete();

    res.json({ message: "Product deleted successfully" });

  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

/* ==============================
   CATEGORY ROUTES
============================== */

app.post("/api/categories", async (req, res) => {
  try {
    const docRef = await db.collection("categories").add({
      ...req.body,
      createdAt: new Date(),
    });

    res.json({ id: docRef.id, ...req.body });

  } catch (error) {
    console.error("Add category error:", error);
    res.status(500).json({ error: "Failed to add category" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const snapshot = await db.collection("categories").get();

    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(categories);

  } catch (error) {
    console.error("Fetch categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  try {
    await db.collection("categories")
      .doc(req.params.id)
      .update(req.body);

    res.json({ message: "Category updated" });

  } catch (error) {
    res.status(500).json({ error: "Failed to update category" });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    await db.collection("categories")
      .doc(req.params.id)
      .delete();

    res.json({ message: "Category deleted" });

  } catch (error) {
    res.status(500).json({ error: "Failed to delete category" });
  }
});

/* ==============================
   START SERVER
============================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
