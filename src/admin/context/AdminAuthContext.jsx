/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import { getApiUrl, handleApiError, API_URL } from "../../utils/api";

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);

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

      setAdmin(data);

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
            createdAt: new Date(),
          }),
        });
      } catch {
        console.log("Login log failed");
      }

      return true;
    } catch (err) {
      handleApiError("AdminAuth", err);
      return false;
    }
  };

  const logout = async () => {
    const currentAdmin = admin;

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
          createdAt: new Date(),
        }),
      });
    } catch {
      console.log("Logout log failed");
    }

    setAdmin(null);
  };

  const refreshAdmin = async () => {
    if (!admin?.id) return;

    try {
      const res = await fetch(getApiUrl("/api/admins"), {
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": admin.id,
        },
      });
      if (!res.ok) return;

      const admins = await res.json();
      const latest = admins.find((item) => item.id === admin.id);
      if (!latest) return;

      setAdmin((currentAdmin) => {
        if (!currentAdmin) return currentAdmin;

        return {
          ...currentAdmin,
          role: latest.role || currentAdmin.role,
          permissions: Array.isArray(latest.permissions) ? latest.permissions : [],
        };
      });
    } catch (err) {
      handleApiError("AdminAuth", err);
    }
  };

  const getAdminAuthHeaders = () => {
    if (!admin?.id) return {};
    return {
      "x-admin-id": admin.id,
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
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }

  return ctx;
};
