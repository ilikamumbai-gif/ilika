import React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const unsubscribeRef = useRef(null);
  const authStartedRef = useRef(false);

  const loadAuthDeps = async () => {
    const [{ auth }, authMod] = await Promise.all([
      import("../firebase/firebaseConfig"),
      import("firebase/auth"),
    ]);

    return {
      auth,
      onAuthStateChanged: authMod.onAuthStateChanged,
      signOut: authMod.signOut,
      signInWithPopup: authMod.signInWithPopup,
      GoogleAuthProvider: authMod.GoogleAuthProvider,
    };
  };

  /* ===============================
     FETCH FIRESTORE USER DATA
  ================================ */
  const ensureUserRecord = async (firebaseUser) => {
    if (!firebaseUser?.uid) return;

    const res = await fetch(`${API_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || "",
        phone: firebaseUser.phoneNumber || "",
      }),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }
  };

  const fetchUserData = async (uid, firebaseUser = null) => {
    try {
      if (firebaseUser) {
        await ensureUserRecord(firebaseUser);
      }

      const res = await fetch(`${API_URL}/api/users/${uid}`);

      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        return;
      }

      // If we reach here, the browser has already logged the 404 error.
      // We just update the state and provide a meaningful debug message.
      setUserData(null);
      
      if (res.status === 404) {
        console.warn(`User ${uid} not yet available in DB.`);
      }
    } catch (err) {
      console.error("Network or parsing error:", err);
    }
  };

  /* ===============================
     LISTEN AUTH STATE
  ================================ */
  useEffect(() => {
    let mounted = true;
    let idleId;
    let timerId;

    const startAuthListener = async () => {
      if (authStartedRef.current || !mounted) return;
      authStartedRef.current = true;

      try {
        const { auth, onAuthStateChanged } = await loadAuthDeps();

        if (!mounted) return;

        unsubscribeRef.current = onAuthStateChanged(auth, async (user) => {
          if (!mounted) return;

          setCurrentUser(user);
          if (user) {
            await fetchUserData(user.uid, user);
          } else {
            setUserData(null);
          }
          setAuthReady(true);
        });
      } catch (error) {
        console.error("Auth init error:", error);
        if (mounted) setAuthReady(true);
      }
    };

    const queueAuthBootstrap = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(startAuthListener, { timeout: 2500 });
      } else {
        timerId = window.setTimeout(startAuthListener, 1200);
      }
    };

    const onFirstIntent = () => startAuthListener();

    window.addEventListener("pointerdown", onFirstIntent, { once: true, passive: true });
    window.addEventListener("keydown", onFirstIntent, { once: true });
    queueAuthBootstrap();

    return () => {
      mounted = false;
      if (idleId) window.cancelIdleCallback?.(idleId);
      if (timerId) window.clearTimeout(timerId);
      window.removeEventListener("pointerdown", onFirstIntent);
      window.removeEventListener("keydown", onFirstIntent);
      if (typeof unsubscribeRef.current === "function") {
        unsubscribeRef.current();
      }
    };
  }, []);

  /* ===============================
     GOOGLE SIGN IN
  ================================ */
  const signInWithGoogle = async () => {
    const { auth, signInWithPopup, GoogleAuthProvider } = await loadAuthDeps();
    return signInWithPopup(auth, new GoogleAuthProvider());
  };

  /* ===============================
     LOGOUT
  ================================ */
  const logout = async () => {
    setUserData(null);
    const { auth, signOut } = await loadAuthDeps();
    return signOut(auth);
  };

  /* ===============================
     REFRESH USER DATA (call after phone verify)
  ================================ */
  const refreshUserData = async () => {
    if (currentUser) await fetchUserData(currentUser.uid, currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userData,
        logout,
        signInWithGoogle,
        refreshUserData,
        authReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
