import React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { API_URL, getApiUrl, handleApiError } from "../../utils/api";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {

  const [users, setUsers] = useState([]);

  /* ================= FETCH USERS ================= */

  const fetchUsers = async () => {
    if (!API_URL) {
      handleApiError("Users", new Error("VITE_API_URL is missing"));
      setUsers([]);
      return;
    }

    try {
      const res = await fetch(getApiUrl("/api/users"));
      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json().catch(() => []);

      const formattedUsers = (Array.isArray(data) ? data : []).map((user) => ({
        ...user,
        id: user.uid || user.id,
        uid: user.uid || user.id,
        name: user.name || "No Name",
        email: user.email || "",
        phone: user.phone || user.phoneNumber || "",
      }));

      setUsers(formattedUsers);

    } catch (error) {
      handleApiError("Users", error);
      setUsers([]);
    }

  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ================= DELETE USER ================= */

  const deleteUser = async (uid) => {
    if (!API_URL) {
      throw new Error("VITE_API_URL is missing");
    }

    try {
      const res = await fetch(getApiUrl(`/api/users/${uid}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to delete user");
      }

      setUsers(prev =>
        prev.filter(u => u.id !== uid)
      );

    } catch (err) {
      handleApiError("Users", err);
      throw err;
    }

  };

  /* ================= GET USER ================= */

  const getUserById = (id) =>
    users.find((u) => String(u.id) === String(id));

  return (
    <UserContext.Provider
      value={{
        users,
        getUserById,
        deleteUser,
        fetchUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => useContext(UserContext);
