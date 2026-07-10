import admin from "firebase-admin";
import dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, ".env") });
dotenv.config();

const requiredFirebaseEnv = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const missingFirebaseEnv = requiredFirebaseEnv.filter((key) => !process.env[key]);

if (missingFirebaseEnv.length) {
  throw new Error(`Missing Firebase Admin env: ${missingFirebaseEnv.join(", ")}`);
}

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

export { admin, db };
