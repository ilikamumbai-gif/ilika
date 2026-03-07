import { createContext, useContext, useEffect, useState } from "react";

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {

  const [admin, setAdmin] = useState(null);

  const API = `${import.meta.env.VITE_API_URL}/api`;

  /* ================= SESSION CONFIG ================= */

  const SESSION_DURATION = 1000 * 60 * 60 * 6; // 6 hours


  const generateSession = () => {

    const expires = Date.now() + SESSION_DURATION;

    const signature = btoa("ilika_admin_" + expires);

    return { expires, signature };

  };


  const isSessionValid = (session) => {

    if (!session) return false;

    if (Date.now() > session.expires) return false;

    if (session.signature !== btoa("ilika_admin_" + session.expires))
      return false;

    return true;

  };


  /* ================= LOAD ADMIN ================= */

  useEffect(() => {

    const storedAdmin = localStorage.getItem("admin");

    const session = JSON.parse(
      localStorage.getItem("admin_session")
    );

    if (storedAdmin && isSessionValid(session)) {

      setAdmin(JSON.parse(storedAdmin));

    } else {

      localStorage.removeItem("admin");
      localStorage.removeItem("admin_session");

    }

  }, []);


  /* ================= LOGIN ================= */

  const login = async (username, password) => {

    try {

      const res = await fetch(`${API}/admin-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) return false;

      const session = generateSession();

      setAdmin(data);

      localStorage.setItem(
        "admin",
        JSON.stringify(data)
      );

      localStorage.setItem(
        "admin_session",
        JSON.stringify(session)
      );

      /* ================= LOG LOGIN ================= */

      try {

        await fetch(`${API}/admin-log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "ADMIN_LOGIN",
            admin: data.username,
            message: `${data.username} logged into admin panel`,
            createdAt: new Date()
          })
        });

      } catch (err) {
        console.log("Login log failed");
      }

      return true;

    } catch (err) {

      console.error("Login error", err);

      return false;

    }

  };


  /* ================= LOGOUT ================= */

  const logout = async () => {

    const currentAdmin =
      JSON.parse(localStorage.getItem("admin"));

    try {

      await fetch(`${API}/admin-log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "ADMIN_LOGOUT",
          admin: currentAdmin?.username || "admin",
          message: `${currentAdmin?.username || "admin"} logged out`,
          createdAt: new Date()
        })
      });

    } catch (err) {
      console.log("Logout log failed");
    }

    setAdmin(null);

    localStorage.removeItem("admin");
    localStorage.removeItem("admin_session");

  };


  return (

    <AdminAuthContext.Provider
      value={{ admin, login, logout }}
    >

      {children}

    </AdminAuthContext.Provider>

  );

};


export const useAdminAuth = () => {

  const ctx = useContext(AdminAuthContext);

  if (!ctx) {
    throw new Error(
      "useAdminAuth must be used inside AdminAuthProvider"
    );
  }

  return ctx;

};