export const logActivity = async (message) => {

  const API = import.meta.env.VITE_API_URL;

  try {

    /* GET ADMIN SAFELY */
    const storedAdmin = localStorage.getItem("admin");
    let adminName = "admin";

    if (storedAdmin) {
      try {
        const parsed = JSON.parse(storedAdmin);
        adminName = parsed?.username || "admin";
      } catch {
        adminName = "admin";
      }
    }

    await fetch(`${API}/api/admin-log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        admin: adminName,
        createdAt: new Date().toISOString()
      }),
    });

  } catch (err) {
    console.log("Log error", err);
  }

};