import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData]       = useState(null);
  const [loading, setLoading]         = useState(true);

  const provider = new GoogleAuthProvider();

  /* ===============================
     FETCH (or create) FIRESTORE USER
     Pass the Firebase `user` object so we can auto-create on first login.
  ================================ */
  const fetchUserData = async (uid, firebaseUser = null) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${uid}`);

      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        return;
      }

      // 404 → first-time login; create the user record then fetch again
      if (res.status === 404 && firebaseUser) {
        const createRes = await fetch(`${API_URL}/api/users/login`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid:   firebaseUser.uid,
            email: firebaseUser.email,
            name:  firebaseUser.displayName || "",
          }),
        });

        if (!createRes.ok) {
          console.error("Failed to create user:", await createRes.text());
          return;
        }

        // Fetch the freshly-created document
        const res2 = await fetch(`${API_URL}/api/users/${uid}`);
        if (res2.ok) {
          const data2 = await res2.json();
          setUserData(data2);
        }
        return;
      }

      console.error("fetchUserData unexpected status:", res.status);
    } catch (err) {
      console.error("Failed to fetch userData:", err);
    }
  };

  /* ===============================
     LISTEN AUTH STATE
  ================================ */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Pass the full Firebase user so fetchUserData can auto-create it
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
  const signInWithGoogle = () => signInWithPopup(auth, provider);

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
    if (currentUser) await fetchUserData(currentUser.uid);
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

export const useAuth = () => useContext(AuthContext);