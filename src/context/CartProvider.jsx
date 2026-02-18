import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../../Backend/firebaseConfig";
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
  const navigate = useNavigate();

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  /* LOAD USER CART WHEN LOGIN */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const cartRef = collection(db, "users", user.uid, "cart");
      const snapshot = await getDocs(cartRef);

      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCartItems(items);
    });

    return () => unsubscribe();
  }, []);

  /* ADD TO CART (guest allowed) */
  const addToCart = async (product) => {
    const user = auth.currentUser;

    // ---------- GUEST ----------
    if (!user) {
      setCartItems(prev => {
        const existing = prev.find(item => item.id === product.id);

        if (existing) {
          return prev.map(item =>
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
    const existing = cartItems.find(item => item.id === product.id);
    const newQuantity = existing ? existing.quantity + 1 : 1;

    await setDoc(doc(db, "users", user.uid, "cart", product.id), {
      ...product,
      quantity: newQuantity,
    });

    setCartItems(prev => {
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
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
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  /* DECREMENT */
  const decrementQty = async (id) => {
    const user = auth.currentUser;
    const item = cartItems.find((item) => item.id === id);
    if (!item) return;

    const newQuantity = item.quantity - 1;

    if (newQuantity <= 0) {
      if (user)
        await deleteDoc(doc(db, "users", user.uid, "cart", id));

      setCartItems(prev => prev.filter(item => item.id !== id));
      return;
    }

    if (user) {
      await setDoc(doc(db, "users", user.uid, "cart", id), {
        ...item,
        quantity: newQuantity,
      });
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
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
