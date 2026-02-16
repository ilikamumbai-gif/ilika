import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
        const data = await res.json();

        const formattedUsers = data.map((user) => ({
          id: user.uid,           // matches UI
          name: user.name || "No Name",
          email: user.email
        }));
          
        setUsers(formattedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const getUserById = (id) =>
    users.find((u) => String(u.id) === String(id));

  return (
    <UserContext.Provider value={{ users, getUserById }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => useContext(UserContext);
