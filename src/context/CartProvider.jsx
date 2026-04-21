import React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const { currentUser } = useAuth();

  const loadFirestoreDeps = async () => {
    const [{ db }, firestore] = await Promise.all([
      import("../firebase/firebaseConfig"),
      import("firebase/firestore"),
    ]);

    return { db, ...firestore };
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  /* LOAD USER CART WHEN LOGIN */
  useEffect(() => {
    let mounted = true;

    const loadCart = async () => {
      if (!currentUser) {
        if (!mounted) return;
        setCartItems([]);
        setIsCartLoaded(true);
        return;
      }

      try {
        const { db, collection, getDocs } = await loadFirestoreDeps();
        if (!mounted) return;

        const cartRef = collection(db, "users", currentUser.uid, "cart");
        const snapshot = await getDocs(cartRef);

        if (!mounted) return;

        const items = snapshot.docs.map((itemDoc) => ({
          id: itemDoc.id,
          ...itemDoc.data(),
        }));

        setCartItems(items);
      } catch (error) {
        console.error("Load cart error:", error);
        if (mounted) setCartItems([]);
      } finally {
        if (mounted) setIsCartLoaded(true);
      }
    };

    loadCart();
    return () => {
      mounted = false;
    };
  }, [currentUser]);

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
          userId: currentUser?.uid || null,
          userEmail: currentUser?.email || null,
        }),
      });
    } catch (err) {
      console.log("cart event error", err);
    }

    // ---------- GUEST ----------
    if (!currentUser) {
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
    const { db, doc, setDoc } = await loadFirestoreDeps();

    await setDoc(doc(db, "users", currentUser.uid, "cart", product.id), {
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
    const item = cartItems.find((item) => item.id === id);
    if (!item) return;

    const newQuantity = item.quantity + 1;

    if (currentUser) {
      const { db, doc, setDoc, addDoc, collection } = await loadFirestoreDeps();
      await setDoc(doc(db, "users", currentUser.uid, "cart", id), {
        ...item,
        quantity: newQuantity,
      });

      // FIX: use `item` instead of undefined `product`, and guard inside `if (user)`
      await addDoc(collection(db, "cartEvents"), {
        productId: item.id,
        name: item.name,
        price: item.price,
        userId: currentUser.uid,
        createdAt: Date.now(),
      });
    }

    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: newQuantity } : i))
    );
  };

  /* DECREMENT */
  const decrementQty = async (id) => {
    const item = cartItems.find((item) => item.id === id);
    if (!item) return;

    const newQuantity = item.quantity - 1;

    if (newQuantity <= 0) {
      if (currentUser) {
        const { db, doc, deleteDoc } = await loadFirestoreDeps();
        await deleteDoc(doc(db, "users", currentUser.uid, "cart", id));
      }

      setCartItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    if (currentUser) {
      const { db, doc, setDoc } = await loadFirestoreDeps();
      await setDoc(doc(db, "users", currentUser.uid, "cart", id), {
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
    if (currentUser) {
      const { db, collection, getDocs, doc, deleteDoc } = await loadFirestoreDeps();
      const cartRef = collection(db, "users", currentUser.uid, "cart");
      const snapshot = await getDocs(cartRef);
      for (const item of snapshot.docs) {
        await deleteDoc(doc(db, "users", currentUser.uid, "cart", item.id));
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
