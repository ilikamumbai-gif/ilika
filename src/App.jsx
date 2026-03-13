import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import LoginPopup from "./components/LoginPopup";

import NavRoutes from "./Routes/NavRoutes";
import { captureTrafficSource } from "./utils/tracking";
import { CartProvider } from "./context/CartProvider";
import ScrollToTopButton from "./components/ScrollToTopButton";
// import { UserOrderProvider } from "./context/UserOrderContext";
import { OrderProvider } from "./admin/context/OrderContext";
import { UserProvider } from "./admin/context/UserContext";
import { ProductProvider } from "./admin/context/ProductContext";
import { CategoryProvider } from "./admin/context/CategoryContext";
import { ComboProvider } from "./admin/context/ComboContext";
import BlogProvider from "./admin/context/BlogProvider";
import { CartEventProvider } from "./admin/context/CartEventContext";
import { ReviewProvider } from "./admin/context/ReviewContext";
import MetaPixelTracker from "./components/MetaPixelTracker";

// One-time cleanup: remove ALL old pixel localStorage keys from previous code versions
// This runs immediately (not in useEffect) so it happens before any pixel fires
// ─────────────────────────────────────────────

(function cleanOldPixelKeys() {
  try {
    const EXPIRY_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

    Object.keys(localStorage).forEach((key) => {
      // Remove completely old key formats from previous versions
      if (
        key.startsWith("px_purchase_") ||
        key.startsWith("purchase_tracked_") ||
        key.startsWith("order_total") ||
        key.startsWith("order_items")
      ) {
        localStorage.removeItem(key);
        return;
      }

      // Expire current-format keys older than 14 days
      if (key.startsWith("purchase_") && key.endsWith("_time")) {
        const timeVal = localStorage.getItem(key);
        if (timeVal && Date.now() - Number(timeVal) > EXPIRY_MS) {
          // Remove both the flag and timestamp keys
          const baseKey = key.replace("_time", "");
          localStorage.removeItem(baseKey);
          localStorage.removeItem(key);
        }
      }
    });
  } catch (e) {
    // localStorage unavailable — safe to ignore
  }
})();

const App = () => {
  const { currentUser } = useAuth();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  useEffect(() => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("px_purchase_")) {
        localStorage.removeItem(key);
      }
    });
  }, []);


  useEffect(() => {
    captureTrafficSource();
  }, []);

  useEffect(() => {
    if (currentUser) return;
    if (sessionStorage.getItem("loginPopupShown")) return;

    const timer = setTimeout(() => {
      setShowLoginPopup(true);
      sessionStorage.setItem("loginPopupShown", "true");
    }, 10000);

    return () => clearTimeout(timer);
  }, [currentUser]);

  return (
    <div className="min-h-screen flex flex-col">

      <UserProvider>
        <OrderProvider>
          <CartProvider>
            <CategoryProvider>
              <ProductProvider>
                <ComboProvider>
                  <CartEventProvider>
                    <BlogProvider>
                      <ReviewProvider>
                        {/* <UserOrderProvider> */}
                          {showLoginPopup && (
                            <LoginPopup
                              onClose={() => setShowLoginPopup(false)}
                            />
                          )}
                          <MetaPixelTracker />
                          <NavRoutes />
                          <ScrollToTopButton />
                        {/* </UserOrderProvider> */}
                      </ReviewProvider>
                    </BlogProvider>
                  </CartEventProvider>
                </ComboProvider>
              </ProductProvider>
            </CategoryProvider>
          </CartProvider>
        </OrderProvider>
      </UserProvider>
    </div>
  );
};

export default App;