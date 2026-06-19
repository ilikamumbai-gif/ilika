import React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { getApiUrl, handleApiError, API_URL } from "../../utils/api";

const AdminAuthContext = createContext(null);

const getStoredAdminSession = () => {
  if (typeof window === "undefined") return null;

  try {
    const storedAdmin = localStorage.getItem("admin");
    const rawSession = localStorage.getItem("admin_session");
    return {
      storedAdmin,
      session: rawSession ? JSON.parse(rawSession) : null,
    };
  } catch {
    return {
      storedAdmin: null,
      session: null,
    };
  }
};

export const AdminAuthProvider = ({ children }) => {

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


  const [admin, setAdmin] = useState(() => {
    const { storedAdmin, session } = getStoredAdminSession();

    if (storedAdmin && isSessionValid(session)) {
      try {
        return JSON.parse(storedAdmin);
      } catch {
        return null;
      }
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("admin");
      localStorage.removeItem("admin_session");
    }

    return null;
  });

  /* ================= LOAD ADMIN ================= */

  useEffect(() => {
    const { storedAdmin, session } = getStoredAdminSession();

    if (storedAdmin && isSessionValid(session)) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch {
        setAdmin(null);
      }

    } else {

      localStorage.removeItem("admin");
      localStorage.removeItem("admin_session");

    }

  }, []);


  /* ================= LOGIN ================= */

  const login = async (username, password) => {

    try {
      if (!API_URL) {
        handleApiError("AdminAuth", new Error("VITE_API_URL is missing"));
        return false;
      }

      const res = await fetch(getApiUrl("/api/admin-login"), {
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

        await fetch(getApiUrl("/api/admin-log"), {
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

      handleApiError("AdminAuth", err);

      return false;

    }

  };


  /* ================= LOGOUT ================= */

  const logout = async () => {

    const currentAdmin =
      JSON.parse(localStorage.getItem("admin"));

    try {

      await fetch(getApiUrl("/api/admin-log"), {
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

  const refreshAdmin = async () => {
    const currentAdmin = JSON.parse(localStorage.getItem("admin"));
    if (!currentAdmin?.id) return;

    try {
      const res = await fetch(getApiUrl("/api/admins"), {
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": currentAdmin.id,
        },
      });
      if (!res.ok) return;

      const admins = await res.json();
      const latest = admins.find((item) => item.id === currentAdmin.id);
      if (!latest) return;

      const mergedAdmin = {
        ...currentAdmin,
        role: latest.role || currentAdmin.role,
        permissions: Array.isArray(latest.permissions) ? latest.permissions : [],
      };

      setAdmin(mergedAdmin);
      localStorage.setItem("admin", JSON.stringify(mergedAdmin));
    } catch (err) {
      handleApiError("AdminAuth", err);
    }
  };

  const getAdminAuthHeaders = () => {
    const currentAdmin = JSON.parse(localStorage.getItem("admin"));
    if (!currentAdmin?.id) return {};
    return {
      "x-admin-id": currentAdmin.id,
    };
  };


  return (

    <AdminAuthContext.Provider
      value={{ admin, login, logout, refreshAdmin, getAdminAuthHeaders }}
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
