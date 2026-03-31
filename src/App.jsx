import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import LoginPopup from "./components/LoginPopup";

import NavRoutes from "./Routes/NavRoutes";
import { captureTrafficSource } from "./utils/tracking";
import { initAutoTrack } from "./utils/autoTrack";
import { CartProvider } from "./context/CartProvider";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { UserOrderProvider } from "./context/UserOrderContext";
import { OrderProvider } from "./admin/context/OrderContext";
import { UserProvider } from "./admin/context/UserContext";
import { ProductProvider } from "./admin/context/ProductContext";
import { CategoryProvider } from "./admin/context/CategoryContext";
import { ComboProvider } from "./admin/context/ComboContext";
import BlogProvider from "./admin/context/BlogProvider";
import { CartEventProvider } from "./admin/context/CartEventContext";
import { ReviewProvider } from "./admin/context/ReviewContext";
import EnquiryButton from "./components/EnquiryButton";

// One-time cleanup: remove ALL old pixel localStorage keys from previous code versions
// This runs immediately (not in useEffect) so it happens before any pixel fires
(function cleanOldPixelKeys() {
  try {
    const PURCHASE_TTL_MS = 10 * 60 * 1000; // 10 min — must match pixel.js
    Object.keys(localStorage).forEach((key) => {
      // Remove old legacy formats from previous code versions
      if (
        key.startsWith("purchase_tracked_") ||
        key.startsWith("order_total") ||
        key.startsWith("order_items")
      ) {
        localStorage.removeItem(key);
        return;
      }
      // Remove expired px_purchase_ TTL entries so storage doesn't grow forever
      if (key.startsWith("px_purchase_")) {
        try {
          const { ts } = JSON.parse(localStorage.getItem(key));
          if (Date.now() - ts > PURCHASE_TTL_MS) {
            localStorage.removeItem(key);
          }
        } catch (_) {
          localStorage.removeItem(key); // corrupt entry — remove it
        }
      }
    });
  } catch (e) {}
})();

const App = () => {
  const { currentUser } = useAuth();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  useEffect(() => {
    captureTrafficSource();
    const cleanup = initAutoTrack();
    return cleanup;
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
                        <UserOrderProvider>
                          {showLoginPopup && (
                            <LoginPopup
                              onClose={() => setShowLoginPopup(false)}
                            />
                          )}
                          <NavRoutes />
                          <EnquiryButton />
                          <ScrollToTopButton />
                        </UserOrderProvider>
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