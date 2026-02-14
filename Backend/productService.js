import { db } from "./firebaseConfig";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";

const productRef = collection(db, "products");

export const addProduct = (data) => addDoc(productRef, data);

export const getProducts = async () => {
  const snapshot = await getDocs(productRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteProduct = (id) =>
  deleteDoc(doc(db, "products", id));

export const updateProduct = (id, data) =>
  updateDoc(doc(db, "products", id), data);
