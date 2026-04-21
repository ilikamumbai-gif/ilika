import React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { addDoc } from "firebase/firestore";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const navigate = useNavigate();

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  /* LOAD USER CART WHEN LOGIN */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCartItems([]);
        setIsCartLoaded(true);
        return;
      }

      const cartRef = collection(db, "users", user.uid, "cart");
      const snapshot = await getDocs(cartRef);

      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCartItems(items);
      setIsCartLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  /* ADD TO CART (guest allowed) */
  const addToCart = async (product) => {

    // SAVE CART EVENT
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/cart-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          price: product.price,
          image:
            product?.image ||
            product?.images?.[0] ||
            product?.imageUrl ||
            product?.variants?.[0]?.images?.[0] ||
            null,
          userId: auth.currentUser?.uid || null,
          userEmail: auth.currentUser?.email || null,
        }),
      });
    } catch (err) {
      console.log("cart event error", err);
    }

    const user = auth.currentUser;

    // ---------- GUEST ----------
    if (!user) {
      setCartItems((prev) => {
        const existing = prev.find((item) => item.id === product.id);

        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }

        return [...prev, { ...product, quantity: 1 }];
      });

      openCart();
      return;
    }

    // ---------- LOGGED ----------
    const existing = cartItems.find((item) => item.id === product.id);
    const newQuantity = existing ? existing.quantity + 1 : 1;

    await setDoc(doc(db, "users", user.uid, "cart", product.id), {
      ...product,
      quantity: newQuantity,
    });

    setCartItems((prev) => {
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    openCart();
  };

  /* INCREMENT */
  const incrementQty = async (id) => {
    const user = auth.currentUser;
    const item = cartItems.find((item) => item.id === id);
    if (!item) return;

    const newQuantity = item.quantity + 1;

    if (user) {
      await setDoc(doc(db, "users", user.uid, "cart", id), {
        ...item,
        quantity: newQuantity,
      });

      // FIX: use `item` instead of undefined `product`, and guard inside `if (user)`
      await addDoc(collection(db, "cartEvents"), {
        productId: item.id,
        name: item.name,
        price: item.price,
        userId: user.uid,
        createdAt: Date.now(),
      });
    }

    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: newQuantity } : i))
    );
  };

  /* DECREMENT */
  const decrementQty = async (id) => {
    const user = auth.currentUser;
    const item = cartItems.find((item) => item.id === id);
    if (!item) return;

    const newQuantity = item.quantity - 1;

    if (newQuantity <= 0) {
      if (user) await deleteDoc(doc(db, "users", user.uid, "cart", id));

      setCartItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    if (user) {
      await setDoc(doc(db, "users", user.uid, "cart", id), {
        ...item,
        quantity: newQuantity,
      });
    }

    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: newQuantity } : i))
    );
  };

  /* CLEAR CART */
  const clearCart = async () => {
    const user = auth.currentUser;

    if (user) {
      const cartRef = collection(db, "users", user.uid, "cart");
      const snapshot = await getDocs(cartRef);
      for (const item of snapshot.docs) {
        await deleteDoc(doc(db, "users", user.uid, "cart", item.id));
      }
    }

    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        isCartOpen,
        openCart,
        closeCart,
        cartItems,
        isCartLoaded,
        addToCart,
        incrementQty,
        decrementQty,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);