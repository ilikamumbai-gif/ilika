import React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const provider = new GoogleAuthProvider();

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid, user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /* ===============================
     GOOGLE SIGN IN
  ================================ */
  const signInWithGoogle = () => {
    return signInWithPopup(auth, provider);
  };

  /* ===============================
     LOGOUT
  ================================ */
  const logout = () => {
    setUserData(null);
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
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
