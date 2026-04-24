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

  const createIdSuffix = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const isFreeComboItem = (comboItem) =>
    Boolean(comboItem?.isFree) || /\(free\)/i.test(comboItem?.name || "");

  const stripFreeSuffix = (name = "") =>
    String(name).replace(/\s*\(free\)\s*$/i, "").trim();

  const isMaskDuoCustom = (item) =>
    Boolean(
      item &&
      (item.baseProductId === "mask-duo-custom" ||
        item.id === "mask-duo-custom" ||
        String(item.id || "").startsWith("mask-duo-custom"))
    );

  const getExistingFreeMask = (item) => {
    const freeMask = Array.isArray(item?.comboItems)
      ? item.comboItems.find((sub) => isFreeComboItem(sub))
      : null;

    if (!freeMask) return null;

    return {
      name: stripFreeSuffix(freeMask.name || "Surprise Mask"),
      image:
        (Array.isArray(freeMask.image) ? freeMask.image[0] : freeMask.image) ||
        "/placeholder.webp",
    };
  };

  const normalizeMaskNameKey = (name = "") =>
    stripFreeSuffix(name).toLowerCase();

  const getUsedSurpriseMaskNames = (items = [], excludeIds = new Set()) => {
    const usedMaskNames = new Set();

    for (const item of items) {
      if (!isMaskDuoCustom(item) || excludeIds.has(item.id)) continue;

      const freeMask = getExistingFreeMask(item);
      const key = normalizeMaskNameKey(freeMask?.name || "");
      if (key) usedMaskNames.add(key);
    }

    return usedMaskNames;
  };

  const pickFreeMask = (sourceItem, preferredFreeMask, usedSurpriseMaskNames) => {
    const fallbackFreeMask =
      preferredFreeMask || getExistingFreeMask(sourceItem) || { name: "Surprise Mask", image: "/placeholder.webp" };

    if (preferredFreeMask) return preferredFreeMask;

    const freeMaskOptions = Array.isArray(sourceItem?.freeMaskOptions)
      ? sourceItem.freeMaskOptions
      : [];

    if (!freeMaskOptions.length) return fallbackFreeMask;

    const availableOptions = freeMaskOptions.filter((mask) => {
      const key = normalizeMaskNameKey(mask?.name || "");
      return key && !usedSurpriseMaskNames.has(key);
    });

    const pool = availableOptions.length ? availableOptions : freeMaskOptions;
    return pool[Math.floor(Math.random() * pool.length)] || fallbackFreeMask;
  };

  const buildMaskDuoUnit = (sourceItem, options = {}) => {
    const { preferredFreeMask = null, usedSurpriseMaskNames = new Set() } = options;
    const paidMasks = Array.isArray(sourceItem?.comboItems)
      ? sourceItem.comboItems
        .filter((sub) => !isFreeComboItem(sub))
        .map((sub) => ({ ...sub }))
      : [];

    const pickedFreeMask = pickFreeMask(
      sourceItem,
      preferredFreeMask,
      usedSurpriseMaskNames
    );
    const pickedName = stripFreeSuffix(pickedFreeMask?.name || "Surprise Mask");
    const pickedNameKey = normalizeMaskNameKey(pickedName);
    if (pickedNameKey) {
      usedSurpriseMaskNames.add(pickedNameKey);
    }

    return {
      ...sourceItem,
      id: `mask-duo-custom-${createIdSuffix()}`,
      baseProductId: "mask-duo-custom",
      quantity: 1,
      comboItems: [
        ...paidMasks,
        {
          id: `free-mask-${createIdSuffix()}`,
          name: `${pickedName} (FREE)`,
          image: pickedFreeMask?.image || "/placeholder.webp",
          isFree: true,
          price: 0,
        },
      ],
    };
  };

  const expandMaskDuoItem = (item, count, usedSurpriseMaskNames = new Set()) => {
    const totalUnits = Math.max(Number(count) || 1, 1);
    const firstFreeMask = getExistingFreeMask(item);
    return Array.from({ length: totalUnits }, (_, index) =>
      buildMaskDuoUnit(item, {
        preferredFreeMask: index === 0 ? firstFreeMask : null,
        usedSurpriseMaskNames,
      })
    );
  };

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

        const idsToReplace = [];
        const normalizedItems = [];
        const usedSurpriseMaskNames = new Set();

        for (const item of items) {
          if (!isMaskDuoCustom(item)) {
            normalizedItems.push(item);
            continue;
          }

          const quantity = Math.max(Number(item.quantity) || 1, 1);
          const needsSplit = quantity > 1 || item.id === "mask-duo-custom";

          if (!needsSplit) {
            const freeMask = getExistingFreeMask(item);
            const key = normalizeMaskNameKey(freeMask?.name || "");
            if (key) usedSurpriseMaskNames.add(key);
            normalizedItems.push(item);
            continue;
          }

          idsToReplace.push(item.id);
          normalizedItems.push(...expandMaskDuoItem(item, quantity, usedSurpriseMaskNames));
        }

        if (idsToReplace.length) {
          const { db, doc, setDoc, deleteDoc } = await loadFirestoreDeps();

          for (const oldId of idsToReplace) {
            await deleteDoc(doc(db, "users", currentUser.uid, "cart", oldId));
          }

          for (const normalizedItem of normalizedItems.filter(isMaskDuoCustom)) {
            await setDoc(doc(db, "users", currentUser.uid, "cart", normalizedItem.id), normalizedItem);
          }
        }

        setCartItems(normalizedItems);
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

    const isMaskDuo = isMaskDuoCustom(product);

    // ---------- GUEST ----------
    if (!currentUser) {
      if (isMaskDuo) {
        setCartItems((prev) => {
          const usedSurpriseMaskNames = getUsedSurpriseMaskNames(prev);
          const singleMaskDuoUnit = buildMaskDuoUnit(product, { usedSurpriseMaskNames });
          return [...prev, singleMaskDuoUnit];
        });
        openCart();
        return;
      }

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
    if (isMaskDuo) {
      const usedSurpriseMaskNames = getUsedSurpriseMaskNames(cartItems);
      const singleMaskDuoUnit = buildMaskDuoUnit(product, { usedSurpriseMaskNames });
      const { db, doc, setDoc } = await loadFirestoreDeps();

      await setDoc(doc(db, "users", currentUser.uid, "cart", singleMaskDuoUnit.id), {
        ...singleMaskDuoUnit,
        quantity: 1,
      });

      setCartItems((prev) => [...prev, singleMaskDuoUnit]);
      openCart();
      return;
    }

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

    if (isMaskDuoCustom(item)) {
      const currentUnits = Math.max(Number(item.quantity) || 1, 1);
      const usedSurpriseMaskNames = getUsedSurpriseMaskNames(cartItems, new Set([id]));
      const updatedUnits = expandMaskDuoItem(item, currentUnits + 1, usedSurpriseMaskNames);

      if (currentUser) {
        const { db, doc, setDoc, deleteDoc } = await loadFirestoreDeps();
        await deleteDoc(doc(db, "users", currentUser.uid, "cart", id));

        for (const unit of updatedUnits) {
          await setDoc(doc(db, "users", currentUser.uid, "cart", unit.id), unit);
        }
      }

      setCartItems((prev) => [
        ...prev.filter((i) => i.id !== id),
        ...updatedUnits,
      ]);
      return;
    }

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

    if (isMaskDuoCustom(item)) {
      const currentUnits = Math.max(Number(item.quantity) || 1, 1);

      if (currentUnits <= 1) {
        if (currentUser) {
          const { db, doc, deleteDoc } = await loadFirestoreDeps();
          await deleteDoc(doc(db, "users", currentUser.uid, "cart", id));
        }

        setCartItems((prev) => prev.filter((cartItem) => cartItem.id !== id));
        return;
      }

      const usedSurpriseMaskNames = getUsedSurpriseMaskNames(cartItems, new Set([id]));
      const updatedUnits = expandMaskDuoItem(item, currentUnits - 1, usedSurpriseMaskNames);

      if (currentUser) {
        const { db, doc, setDoc, deleteDoc } = await loadFirestoreDeps();
        await deleteDoc(doc(db, "users", currentUser.uid, "cart", id));

        for (const unit of updatedUnits) {
          await setDoc(doc(db, "users", currentUser.uid, "cart", unit.id), unit);
        }
      }

      setCartItems((prev) => [
        ...prev.filter((i) => i.id !== id),
        ...updatedUnits,
      ]);
      return;
    }

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
