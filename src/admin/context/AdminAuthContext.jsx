/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { getApiUrl, handleApiError, API_URL } from "../../utils/api";

const AdminAuthContext = createContext(null);
const ADMIN_SESSION_KEY = "ilika.admin.session";

const readStoredAdmin = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStoredAdmin = (admin) => {
  if (typeof window === "undefined") return;

  try {
    if (admin) {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin));
    } else {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch {
    // Ignore storage failures and keep in-memory auth working.
  }
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => readStoredAdmin());
  const [authReady, setAuthReady] = useState(() => !readStoredAdmin());

  const loadGoogleAuthDeps = async () => {
    const [{ auth }, authMod] = await Promise.all([
      import("../../firebase/firebaseConfig"),
      import("firebase/auth"),
    ]);

    return {
      auth,
      signInWithPopup: authMod.signInWithPopup,
      GoogleAuthProvider: authMod.GoogleAuthProvider,
    };
  };

  useEffect(() => {
    let isMounted = true;

    const validateStoredAdmin = async () => {
      const storedAdmin = readStoredAdmin();
      if (!storedAdmin?.id) {
        writeStoredAdmin(null);
        if (isMounted) {
          setAdmin(null);
          setAuthReady(true);
        }
        return;
      }

      if (!API_URL) {
        writeStoredAdmin(null);
        if (isMounted) {
          setAdmin(null);
          setAuthReady(true);
        }
        return;
      }

      try {
        const res = await fetch(getApiUrl("/api/admins"), {
          headers: {
            "Content-Type": "application/json",
            "x-admin-id": storedAdmin.id,
          },
        });

        if (!res.ok) {
          throw new Error("Stored admin session is no longer valid");
        }

        const admins = await res.json().catch(() => []);
        const latest = Array.isArray(admins)
          ? admins.find((item) => item.id === storedAdmin.id)
          : null;

        if (!latest) {
          throw new Error("Stored admin session is no longer valid");
        }

        const nextAdmin = {
          ...storedAdmin,
          role: latest.role || storedAdmin.role,
          permissions: Array.isArray(latest.permissions) ? latest.permissions : [],
        };

        writeStoredAdmin(nextAdmin);
        if (isMounted) {
          setAdmin(nextAdmin);
          setAuthReady(true);
        }
      } catch {
        writeStoredAdmin(null);
        if (isMounted) {
          setAdmin(null);
          setAuthReady(true);
        }
      }
    };

    validateStoredAdmin();

    return () => {
      isMounted = false;
    };
  }, []);

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
      writeStoredAdmin(data);
      setAuthReady(true);

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

  const loginWithGoogle = async () => {
    try {
      if (!API_URL) {
        handleApiError("AdminAuth", new Error("VITE_API_URL is missing"));
        return false;
      }

      const { auth, signInWithPopup, GoogleAuthProvider } = await loadGoogleAuthDeps();
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await result.user.getIdToken();

      const res = await fetch(getApiUrl("/api/admin-google-login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data) return false;

      setAdmin(data);
      writeStoredAdmin(data);
      setAuthReady(true);

      try {
        await fetch(getApiUrl("/api/admin-log"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "ADMIN_GOOGLE_LOGIN",
            admin: data.username || data.email || "admin",
            message: `${data.username || data.email || "Admin"} logged into admin panel with Google`,
            createdAt: new Date(),
          }),
        });
      } catch {
        console.log("Google login log failed");
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
    writeStoredAdmin(null);
    setAuthReady(true);
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

        const nextAdmin = {
          ...currentAdmin,
          role: latest.role || currentAdmin.role,
          permissions: Array.isArray(latest.permissions) ? latest.permissions : [],
        };
        writeStoredAdmin(nextAdmin);
        return nextAdmin;
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
      value={{ admin, authReady, login, loginWithGoogle, logout, refreshAdmin, getAdminAuthHeaders }}
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
