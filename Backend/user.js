import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";


// ✅ Register (Now includes phone + OTP check)
export const registerUser = async (email, password, phone, otpVerified) => {

  // 🔒 Phone compulsory
  if (!phone) {
    throw new Error("Phone number is required");
  }

  // 🔒 Must verify OTP first
  if (!otpVerified) {
    throw new Error("Phone number not verified");
  }

  // 🔒 Validate Indian phone number
  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new Error("Invalid Indian phone number");
  }

  // 🔒 Check if phone already exists
  const q = query(collection(db, "users"), where("phone", "==", phone));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    throw new Error("Phone number already registered");
  }

  // ✅ Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // ✅ Store user data in Firestore
  await setDoc(doc(db, "users", userCredential.user.uid), {
    email,
    phone,
    role: "user",
    createdAt: new Date()
  });

  return userCredential.user;
};


// Login
export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);


// Logout
export const logoutUser = () => signOut(auth);


// Get user role
export const getUserRole = async (uid) => {
  const docSnap = await getDoc(doc(db, "users", uid));
  return docSnap.exists() ? docSnap.data().role : null;
};