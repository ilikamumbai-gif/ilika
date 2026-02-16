import { createContext, useContext, useEffect, useState } from "react";

const AdminAuthContext = createContext(null);

const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "123654789",
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);

  // Load admin from localStorage
  useEffect(() => {
    const storedAdmin = localStorage.getItem("admin");
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }
  }, []);

  const login = (username, password) => {
    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const adminData = { id: 1, name: "Admin" };
      setAdmin(adminData);
      localStorage.setItem("admin", JSON.stringify(adminData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem("admin");
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
