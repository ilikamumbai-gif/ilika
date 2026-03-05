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
  "https://ilika.in",
  "https://www.ilika.in",
  process.env.FRONTEND_URL,
];

const detectSource = (source) => {
  if (!source) return "WEBSITE";

  const s = source.toLowerCase();

  if (s.includes("meta") || s.includes("facebook") || s.includes("instagram"))
    return "META ADS";

  if (s.includes("google") || s.includes("gclid"))
    return "GOOGLE ADS";

  return s.toUpperCase();
};


app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
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

/* ================= DELETE USER ================= */

app.delete("/api/users/:uid", async (req, res) => {
  try {

    const uid = req.params.uid;

    // delete user doc
    await db.collection("users")
      .doc(uid)
      .delete();

    // delete addresses
    const addrSnap = await db
      .collection("users")
      .doc(uid)
      .collection("addresses")
      .get();

    const batch = db.batch();

    addrSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.json({
      message: "User deleted"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to delete user"
    });
  }
});
/* ============================== PRODUCTS ============================== */
app.post("/api/products", async (req, res) => {
  try {
    const now = Date.now();

    const productData = {
      ...req.body,
      isActive: req.body.isActive ?? true,   // ⭐ default true
      inStock: req.body.inStock ?? true,     // ⭐ default true
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("products").add(productData);

    res.json({ id: docRef.id, ...productData });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
});



app.get("/api/products/:id", async (req, res) => {
  try {
    const doc = await db.collection("products").doc(req.params.id).get();

    if (!doc.exists)
      return res.status(404).json({ error: "Product not found" });

    res.json({ id: doc.id, ...doc.data() });
  } catch {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});



app.get("/api/products", async (req, res) => {
  try {
    const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(products);
  } catch {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});



app.put("/api/products/:id", async (req, res) => {
  try {
    const productRef = db.collection("products").doc(req.params.id);
    const existingDoc = await productRef.get();

    if (!existingDoc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const existingData = existingDoc.data();

    const updateData = {
      ...req.body,

      // Preserve boolean fields safely
      isActive:
        typeof req.body.isActive === "boolean"
          ? req.body.isActive
          : existingData.isActive ?? true,

      inStock:
        typeof req.body.inStock === "boolean"
          ? req.body.inStock
          : existingData.inStock ?? true,

      updatedAt: Date.now(),
    };

    await productRef.update(updateData);

    // Return updated document
    const updatedDoc = await productRef.get();

    res.json({
      message: "Product updated successfully",
      product: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
    console.log("UPDATE BODY:", req.body);

  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
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

/* ============================== BLOGS ============================== */

// CREATE BLOG
app.post("/api/blogs", async (req, res) => {
  try {

    const { title, image, author, shortDesc, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title required" });
    }

    const now = Date.now();

    const blogData = {
      title: title || "",
      image: image || "",
      author: author || "",
      excerpt: shortDesc || "",
      content: content || "",
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("blogs").add(blogData);

    res.json({
      id: docRef.id,
      ...blogData,
    });

  } catch (error) {
    console.error("ADD BLOG ERROR:", error);  // ⭐ important
    res.status(500).json({ error: "Failed to add blog" });
  }
});


// GET ALL BLOGS
app.get("/api/blogs", async (req, res) => {
  try {

    const snapshot = await db
      .collection("blogs")
      .orderBy("createdAt", "desc")
      .get();

    const blogs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(blogs);

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});


// GET SINGLE BLOG
app.get("/api/blogs/:id", async (req, res) => {
  try {

    const doc = await db
      .collection("blogs")
      .doc(req.params.id)
      .get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.json({
      id: doc.id,
      ...doc.data(),
    });

  } catch {
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});


// DELETE BLOG
app.delete("/api/blogs/:id", async (req, res) => {
  try {

    await db
      .collection("blogs")
      .doc(req.params.id)
      .delete();

    res.json({ message: "Blog deleted" });

  } catch {
    res.status(500).json({ error: "Failed to delete blog" });
  }
});


/* ================= BLOG COMMENTS ================= */

// ADD COMMENT
app.post("/api/blogs/:id/comments", async (req, res) => {
  try {

    const { name, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        error: "Name and message required"
      });
    }

    const commentData = {
      name,
      message,
      createdAt: new Date(),
    };

    const docRef = await db
      .collection("blogs")
      .doc(req.params.id)
      .collection("comments")
      .add(commentData);

    res.json({
      id: docRef.id,
      ...commentData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to add comment"
    });
  }
});

app.put("/api/blogs/:id", async (req, res) => {
  try {

    const blogRef = db.collection("blogs").doc(req.params.id);
    const doc = await blogRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        error: "Blog not found"
      });
    }

    await blogRef.update({
      ...req.body,
      updatedAt: Date.now(),
    });

    res.json({
      message: "Blog updated successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to update blog"
    });
  }
});


// GET COMMENTS
app.get("/api/blogs/:id/comments", async (req, res) => {
  try {

    const snapshot = await db
      .collection("blogs")
      .doc(req.params.id)
      .collection("comments")
      .orderBy("createdAt", "desc")
      .get();

    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(comments);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch comments"
    });
  }
});

app.get("/api/admin/blogs/:id/comments", async (req, res) => {
  try {

    const snapshot = await db
      .collection("blogs")
      .doc(req.params.id)
      .collection("comments")
      .orderBy("createdAt", "desc")
      .get();

    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(comments);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch comments",
    });
  }
});

app.delete("/api/admin/blogs/:blogId/comments/:commentId", async (req, res) => {
  try {

    const { blogId, commentId } = req.params;

    const ref = db
      .collection("blogs")
      .doc(blogId)
      .collection("comments")
      .doc(commentId);

    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({
        error: "Comment not found"
      });
    }

    await ref.delete();

    res.json({
      message: "Comment deleted",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to delete comment",
    });
  }
});

app.get("/api/blogs/:id/comment-count", async (req, res) => {
  try {

    const snapshot = await db
      .collection("blogs")
      .doc(req.params.id)
      .collection("comments")
      .get();

    res.json({
      count: snapshot.size
    });

  } catch (error) {
    res.status(500).json({
      error: "Failed to count comments"
    });
  }
});

app.get("/api/admin/all-comments", async (req, res) => {
  try {

    const blogsSnapshot = await db.collection("blogs").get();

    let comments = [];

    for (const blogDoc of blogsSnapshot.docs) {

      const blogData = blogDoc.data();
      const blogId = blogDoc.id;

      const commentSnap = await db
        .collection("blogs")
        .doc(blogId)
        .collection("comments")
        .get();

      commentSnap.forEach((doc) => {

        comments.push({
          id: doc.id,
          blogId,
          blogTitle: blogData.title,
          ...doc.data(),
        });

      });

    }

    res.json(comments);

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to fetch comments" });

  }
});

app.delete("/api/admin/comments/:blogId/:commentId", async (req, res) => {

  try {

    const { blogId, commentId } = req.params;

    await db
      .collection("blogs")
      .doc(blogId)
      .collection("comments")
      .doc(commentId)
      .delete();

    res.json({ message: "Comment deleted" });

  } catch (err) {

    res.status(500).json({ error: "Delete failed" });

  }

});

/* ============================== COMBOS ============================== */

app.post("/api/combos", async (req, res) => {
  try {
    const now = Date.now();

    const comboData = {
      ...req.body,
      isActive: req.body.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("combos").add(comboData);

    res.json({ id: docRef.id, ...comboData });
  } catch (error) {
    console.error("ADD COMBO ERROR:", error);
    res.status(500).json({ error: "Failed to add combo" });
  }
});

app.get("/api/combos", async (req, res) => {
  try {
    const snapshot = await db.collection("combos")
      .orderBy("createdAt", "desc")
      .get();

    const combos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(combos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch combos" });
  }
});

app.put("/api/combos/:id", async (req, res) => {
  try {
    await db.collection("combos")
      .doc(req.params.id)
      .update({
        ...req.body,
        updatedAt: Date.now(),
      });

    res.json({ message: "Combo updated successfully" });
  } catch {
    res.status(500).json({ error: "Failed to update combo" });
  }
});

app.delete("/api/combos/:id", async (req, res) => {
  try {
    await db.collection("combos")
      .doc(req.params.id)
      .delete();

    res.json({ message: "Combo deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete combo" });
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
    const { userId, userEmail, items, shippingAddressId, source } = req.body;
    if (!userId || !items?.length) return res.status(400).json({ error: "Invalid order data" });

    const addressDoc = await db.collection("users").doc(userId).collection("addresses").doc(shippingAddressId).get();
    if (!addressDoc.exists) return res.status(400).json({ error: "Invalid address" });

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {

      const quantity = item.quantity || 1;

      /* ================= COMBO PRODUCTS ================= */

      if (item.isCombo || item.items || item.comboItems) {

        const comboProducts = item.items || item.comboItems || [];

        totalAmount += Number(item.price) * quantity;

        validatedItems.push({
          productId: item.id,
          name: item.name || "Custom Combo",
          price: Number(item.price),
          quantity,
          image:
            item.image ||
            productData.image ||
            productData.images?.[0] ||
            "",
          isCombo: true,

          comboItems: comboProducts.map(p => ({
            name: p.name,
            image:
              p.image ||
              p.images?.[0] ||
              p.imageUrl ||
              ""
          }))
        });

        continue;
      }

      /* ================= NORMAL / VARIANT / COUPON PRODUCT ================= */

      const productDoc = await db
        .collection("products")
        .doc(item.id)
        .get();

      if (!productDoc.exists) continue;

      const productData = productDoc.data();

      if (!productData.isActive) continue;

      if (!productData.inStock) {
        return res.status(400).json({
          error: `${productData.name} is out of stock`
        });
      }

      /* ===== FINAL PRICE (coupon / variant safe) ===== */

      const finalPrice =
        Number(item.price) || Number(productData.price);

      totalAmount += finalPrice * quantity;

      validatedItems.push({
        productId: item.id,
        name: item.name || productData.name,
        price: finalPrice,
        quantity,

        image:
          item.image ||
          item.images?.[0] ||
          item.imageUrl ||
          "",

        variantLabel: item.variantLabel || null,

        originalPrice: item.originalPrice || null,

        discountApplied: item.discountApplied || null,

        isCombo: false,
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
      source: detectSource(source),  // ⭐⭐⭐ IMPORTANT
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

/* ============================== DELETE ALL ORDERS ============================== */

app.delete("/api/orders", async (req, res) => {
  try {

    const snapshot = await db.collection("orders").get();

    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.json({ message: "All orders deleted" });

  } catch (error) {
    console.error("DELETE ALL ORDERS ERROR:", error);
    res.status(500).json({ error: "Failed to delete orders" });
  }
});

/* ================= DELETE SINGLE ORDER ================= */

app.delete("/api/orders/:id", async (req, res) => {
  try {

    await db.collection("orders")
      .doc(req.params.id)
      .delete();

    res.json({ message: "Order deleted" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete order" });
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

/* ================= GET ALL REVIEWS ================= */

/* ================= GET ALL REVIEWS ================= */

app.get("/api/reviews", async (req, res) => {
  try {

    const snapshot = await db.collection("products").get();

    let reviews = [];

    snapshot.forEach((doc) => {

      const product = doc.data();

      if (product.reviews && product.reviews.length) {

        product.reviews.forEach((r, index) => {

          reviews.push({
            id: doc.id + "_" + index,

            productId: doc.id,

            reviewIndex: index,   // ⭐ VERY IMPORTANT

            productName: product.name,

            ...r,
          });

        });

      }

    });

    res.json(reviews);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch reviews",
    });
  }
});

/* ================= DELETE REVIEW ================= */

app.delete("/api/reviews/:productId/:index", async (req, res) => {
  try {

    const { productId, index } = req.params;

    const ref = db.collection("products").doc(productId);

    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const data = doc.data();

    const reviews = data.reviews || [];

    reviews.splice(index, 1);

    await ref.update({ reviews });

    res.json({ message: "Review deleted" });

  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

/* ================= GET SINGLE REVIEW ================= */

app.get("/api/reviews/:productId/:index", async (req, res) => {
  try {

    const { productId, index } = req.params;

    const doc = await db
      .collection("products")
      .doc(productId)
      .get();

    if (!doc.exists) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    const data = doc.data();

    const review = data.reviews?.[index];

    if (!review) {
      return res.status(404).json({
        error: "Review not found",
      });
    }

    res.json({
      productId,
      productName: data.name,
      ...review,
    });

  } catch (err) {
    res.status(500).json({
      error: "Failed",
    });
  }
});


/* ================= CART EVENTS ================= */

app.post("/api/cart-events", async (req, res) => {
  try {

    const {
      productId,
      name,
      price,
      image,
      userId,
      userEmail
    } = req.body;

    const eventData = {
      productId,
      name,
      price,
      image,
      userId: userId || null,
      userEmail: userEmail || null,
      createdAt: new Date(),
    };

    const docRef = await db.collection("cartEvents").add(eventData);

    res.json({
      id: docRef.id,
      ...eventData
    });

  } catch (error) {
    console.error("CART EVENT ERROR:", error);
    res.status(500).json({ error: "Failed to save cart event" });
  }
});


app.get("/api/cart-events", async (req, res) => {
  try {

    const snapshot = await db
      .collection("cartEvents")
      .orderBy("createdAt", "desc")
      .get();

    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(events);

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart events" });
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
      orderData
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return res.status(400).json({ error: "Invalid payment data" });

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ error: "Invalid signature" });

    /* ---------- CREATE ORDER AFTER PAYMENT ---------- */

    const addressDoc = await db
      .collection("users")
      .doc(orderData.userId)
      .collection("addresses")
      .doc(orderData.shippingAddressId)
      .get();

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of orderData.items) {

      const quantity = item.quantity || 1;

      /* ================= COMBO / CTM ================= */

      if (item.isCombo || item.items || item.comboItems) {

        const comboProducts = item.items || item.comboItems || [];

        totalAmount += Number(item.price) * quantity;

        validatedItems.push({
          productId: item.id,
          name: item.name || "Custom Combo",
          price: Number(item.price),
          quantity,

          image:
            item.image ||
            item.images?.[0] ||
            item.imageUrl ||
            "",

          isCombo: true,

          comboItems: comboProducts.map(p => ({
            name: p.name,
            image:
              p.image ||
              p.images?.[0] ||
              p.imageUrl ||
              ""
          }))
        });

        continue;
      }

      /* ================= NORMAL PRODUCT ================= */

      const productDoc = await db
        .collection("products")
        .doc(item.id)
        .get();

      if (!productDoc.exists) continue;

      const productData = productDoc.data();

      if (!productData.isActive) continue;

      if (!productData.inStock) {
        return res.status(400).json({
          error: `${productData.name} is out of stock`
        });
      }

      const finalPrice =
        Number(item.price) ||
        Number(productData.price) ||
        0;

      totalAmount += finalPrice * quantity;

      validatedItems.push({
        productId: item.id,
        name: item.name || productData.name,
        price: finalPrice,
        quantity,
        image:
          item.image ||
          item.images?.[0] ||
          item.imageUrl ||
          "",
        variantLabel: item.variantLabel || null,
        originalPrice: item.originalPrice || null,
        discountApplied: item.discountApplied || null,
        isCombo: false,
      });

    }

    const docRef = await db.collection("orders").add({
      userId: orderData.userId,
      userEmail: orderData.userEmail,
      items: validatedItems,
      totalAmount,
      shippingAddress: addressDoc.data(),
      status: "Placed",
      paymentStatus: "Paid",
      source: orderData.source || "WEBSITE",   // ⭐⭐⭐ IMPORTANT
      razorpay_payment_id,
      paidAt: new Date(),
      createdAt: new Date(),
    });

    res.json({ success: true, orderId: docRef.id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

/* ================= ADMIN LOG ================= */

app.post("/api/admin-log", async (req, res) => {

  try {

    const {
      action = "",
      message = "",
      admin = "admin"
    } = req.body;

    const log = {
      action,
      message,
      admin,
      createdAt: new Date(),
    };

    const doc = await db
      .collection("adminLogs")
      .add(log);

    res.json({
      id: doc.id,
      ...log,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Log failed"
    });

  }

});

/* ================= GET ADMIN LOGS ================= */

app.get("/api/admin-log", async (req, res) => {

  try {

    const snapshot = await db
      .collection("adminLogs")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(logs);

  } catch (err) {

    res.status(500).json({
      error: "Failed"
    });

  }

});


/* ============================== START ============================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
