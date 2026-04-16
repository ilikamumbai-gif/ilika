import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {

  const [users, setUsers] = useState([]);

  /* ================= FETCH USERS ================= */

  const fetchUsers = async () => {

    try {

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users`
      );

      const data = await res.json();

      const formattedUsers = data.map((user) => ({
        id: user.uid,
        name: user.name || "No Name",
        email: user.email,
      }));

      setUsers(formattedUsers);

    } catch (error) {
      console.error("Error fetching users:", error);
    }

  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ================= DELETE USER ================= */

  const deleteUser = async (uid) => {

    try {

      await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${uid}`,
        {
          method: "DELETE",
        }
      );

      setUsers(prev =>
        prev.filter(u => u.id !== uid)
      );

    } catch (err) {
      console.error("Delete user error", err);
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