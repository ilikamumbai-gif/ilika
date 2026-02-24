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

import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import LoginPopup from "./components/LoginPopup";

const App = () => {
  const { currentUser } = useAuth();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  captureTrafficSource();

  useEffect(() => {
    if (currentUser) return;

    if (sessionStorage.getItem("loginPopupShown")) return;

    const timer = setTimeout(() => {
      setShowLoginPopup(true);
      sessionStorage.setItem("loginPopupShown", "true");
    }, 7000); // 7 seconds delay

    return () => clearTimeout(timer);
  }, [currentUser]);

  return (
    <div className="min-h-screen flex flex-col">
      <UserProvider>
        <OrderProvider>
          <CartProvider>
            <CategoryProvider>
              <ProductProvider>
                <UserOrderProvider>

                  {showLoginPopup && (
                    <LoginPopup onClose={() => setShowLoginPopup(false)} />
                  )}

                  <MetaPixelTracker />
                  <NavRoutes />
                  <ScrollToTopButton />

                </UserOrderProvider>
              </ProductProvider>
            </CategoryProvider>
          </CartProvider>
        </OrderProvider>
      </UserProvider>
    </div>
  );
};

export default App;
