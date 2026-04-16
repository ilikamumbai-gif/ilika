import { useEffect, useState } from "react";
import { useAuth, AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

import CartEventToast from "./components/CartEventToast";
import CartStatusToast from "./components/CartStatusToast";

import LoginPopup from "./components/LoginPopup";
import NavRoutes from "./Routes/NavRoutes";
import { captureTrafficSource } from "./utils/tracking";
import { initAutoTrack } from "./utils/autoTrack";

import { CartProvider } from "./context/CartProvider";
import { UserOrderProvider } from "./context/UserOrderContext";
import { OrderProvider } from "./admin/context/OrderContext";
import { UserProvider } from "./admin/context/UserContext";
import { ProductProvider } from "./admin/context/ProductContext";
import { CategoryProvider } from "./admin/context/CategoryContext";
import { ComboProvider } from "./admin/context/ComboContext";
import { CartEventProvider } from "./admin/context/CartEventContext";
import { ReviewProvider } from "./admin/context/ReviewContext";
import BlogProvider from "./admin/context/BlogProvider";

import ScrollToTopButton from "./components/ScrollToTopButton";
import EnquiryButton from "./components/EnquiryButton";
import ScrollToTop from "./components/ScrollToTop";

const AppContent = () => {
  const { currentUser } = useAuth();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  /* ===============================
     TRACKING INIT
  ================================ */
  useEffect(() => {
    captureTrafficSource();
    const cleanup = initAutoTrack();
    return cleanup;
  }, []);

  /* ===============================
     LOGIN POPUP LOGIC
  ================================ */
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
    <>
      {/* 🔥 GLOBAL TOAST SYSTEM */}
     <Toaster
  position="top-left" // 👈 default LEFT
  containerStyle={{
    top: "90px",
    left: "20px",
    right: "20px", // 👈 allow both sides
    zIndex: 99999,
  }}
  toastOptions={{
    duration: 3000,
    style: {
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(12px)",
      borderRadius: "20px",
      padding: "0px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      border: "1px solid rgba(0,0,0,0.05)",
    },
  }}
/>

      <div className="min-h-screen flex flex-col">
        <UserProvider>
          <OrderProvider>
            <CartProvider>

              {/* 🔥 CART STATUS TOAST (session + count) */}
              <CartStatusToast />

              <CategoryProvider>
                <ProductProvider>
                  <ComboProvider>
                    <CartEventProvider>

                      {/* 🔥 CART EVENT TOAST (add/remove/update) */}
                      <CartEventToast />

                      <BlogProvider>
                        <ReviewProvider>
                          <UserOrderProvider>

                            {/* LOGIN POPUP */}
                            {showLoginPopup && (
                              <LoginPopup
                                onClose={() => setShowLoginPopup(false)}
                              />
                            )}

                            {/* MAIN ROUTES */}
                            <NavRoutes />

                            {/* FLOATING UI */}
                            <EnquiryButton />
                            <ScrollToTopButton />
                            <ScrollToTop />

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
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;