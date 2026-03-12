import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import LoginPopup from "./components/LoginPopup";

import NavRoutes from "./Routes/NavRoutes";
import { captureTrafficSource } from "./utils/tracking";
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

// One-time cleanup: remove ALL old pixel localStorage keys from previous code versions
// This runs immediately (not in useEffect) so it happens before any pixel fires
(function cleanOldPixelKeys() {
  try {
    Object.keys(localStorage).forEach((key) => {
      // Old formats used in previous versions:
      if (
        key.startsWith("purchase_tracked_") ||  // version 1
        key.startsWith("order_total") ||         // version 0
        key.startsWith("order_items")            // version 0
      ) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {}
})();

const App = () => {
  const { currentUser } = useAuth();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

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
                        <UserOrderProvider>
                          {showLoginPopup && (
                            <LoginPopup
                              onClose={() => setShowLoginPopup(false)}
                            />
                          )}
                          <NavRoutes />
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