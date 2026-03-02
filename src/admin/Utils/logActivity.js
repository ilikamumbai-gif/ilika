export const logActivity = async (message) => {

  const API = import.meta.env.VITE_API_URL;

  try {

    await fetch(`${API}/api/admin-log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        message,
        admin:
          localStorage.getItem("adminEmail") || "admin",
      }),
    });

  } catch (err) {
    console.log("Log error", err);
  }

};