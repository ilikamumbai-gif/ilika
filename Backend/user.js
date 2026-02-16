import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Register
export const registerUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  await setDoc(doc(db, "users", userCredential.user.uid), {
    email,
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
