import { createContext, useContext, useEffect, useState } from "react";

const AdminAuthContext = createContext(null);

const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "123654789",
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);

  // ================= SECURITY HELPERS =================
  const SESSION_DURATION = 1000 * 60 * 60 * 6; // 6 hours

  const generateSession = () => {
    const expires = Date.now() + SESSION_DURATION;
    const signature = btoa("ilika_admin_" + expires);
    return { expires, signature };
  };

  const isSessionValid = (session) => {
    if (!session) return false;
    if (Date.now() > session.expires) return false;
    if (session.signature !== btoa("ilika_admin_" + session.expires)) return false;
    return true;
  };

  // Load admin from localStorage
  useEffect(() => {
    const storedAdmin = localStorage.getItem("admin");
    const session = JSON.parse(localStorage.getItem("admin_session"));

    if (storedAdmin && isSessionValid(session)) {
      setAdmin(JSON.parse(storedAdmin));
    } else {
      localStorage.removeItem("admin");
      localStorage.removeItem("admin_session");
    }
  }, []);

  const login = (username, password) => {
    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const adminData = { id: 1, name: "Admin" };
      const session = generateSession();

      setAdmin(adminData);
      localStorage.setItem("admin", JSON.stringify(adminData));
      localStorage.setItem("admin_session", JSON.stringify(session));

      return true;
    }
    return false;
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_session");
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout }}>
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