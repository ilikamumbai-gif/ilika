import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const provider = new GoogleAuthProvider();

  /* ===============================
     LISTEN AUTH STATE
  ================================ */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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
    return signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        logout,
        signInWithGoogle
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
