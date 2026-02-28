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
import MetaPixelTracker from "./components/MetaPixelTracker";
import { ComboProvider } from "./admin/context/ComboContext";

const App = () => {
  const { currentUser } = useAuth();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  /* ✅ Capture traffic only once */
  useEffect(() => {
    captureTrafficSource();
  }, []);

  /* ✅ Login popup logic */
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
                  <UserOrderProvider>

                    {showLoginPopup && (
                      <LoginPopup onClose={() => setShowLoginPopup(false)} />
                    )}

                    <MetaPixelTracker />
                    <NavRoutes />
                    <ScrollToTopButton />

                  </UserOrderProvider>
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