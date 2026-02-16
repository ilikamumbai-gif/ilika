import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

/* ==============================
   FIREBASE CONNECTION TEST
============================== */

(async () => {
  try {
    await db.collection("health_check").limit(1).get();
    console.log("🔥 Firebase Firestore Connected Successfully");
  } catch (err) {
    console.error("❌ Firebase Firestore Connection Failed", err);
  }
})();

export { db };
