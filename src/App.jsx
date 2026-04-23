import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { useAuth, AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartProvider";
import { ProductProvider } from "./admin/context/ProductContext";
import { CategoryProvider } from "./admin/context/CategoryContext";
import { ComboProvider } from "./admin/context/ComboContext";

import CartStatusToast from "./components/CartStatusToast";
import ScrollToTopButton from "./components/ScrollToTopButton";
import EnquiryButton from "./components/EnquiryButton";
import ScrollToTop from "./components/ScrollToTop";
import NavRoutes from "./Routes/NavRoutes";

import { captureTrafficSource } from "./utils/tracking";

const LoginPopup = lazy(() => import("./components/LoginPopup"));

const AppContent = () => {
  const { currentUser } = useAuth();
  const { pathname } = useLocation();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const isAdminRoute = useMemo(() => pathname.startsWith("/admin"), [pathname]);
  const hideCartToast = useMemo(
    () => pathname === "/blog" || pathname.startsWith("/blog/"),
    [pathname]
  );

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => captureTrafficSource());
    } else {
      setTimeout(captureTrafficSource, 2000);
    }
  }, []);

  useEffect(() => {
    if (isAdminRoute) return undefined;

    let cleanup;
    let cancelled = false;
    const startTracking = () => {
      import("./utils/autoTrack").then((mod) => {
        if (cancelled) return;
        cleanup = mod.initAutoTrack();
      });
    };

    const timer = window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(startTracking, { timeout: 2500 });
      } else {
        startTracking();
      }
    }, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (typeof cleanup === "function") cleanup();
    };
  }, [isAdminRoute]);

  useEffect(() => {
    if (currentUser) return;
    if (sessionStorage.getItem("loginPopupShown")) return;

    const timer = setTimeout(() => {
      setShowLoginPopup(true);
      sessionStorage.setItem("loginPopupShown", "true");
    }, 20000);

    return () => clearTimeout(timer);
  }, [currentUser]);

  return (
    <>
      <Toaster
        position="top-left"
        containerStyle={{
          top: "90px",
          left: "20px",
          right: "20px",
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
        <CartProvider>
          {!hideCartToast && <CartStatusToast />}

          <CategoryProvider>
            <ProductProvider>
              <ComboProvider>
                {showLoginPopup && (
                  <Suspense fallback={null}>
                    <LoginPopup onClose={() => setShowLoginPopup(false)} />
                  </Suspense>
                )}

                <NavRoutes />

                <EnquiryButton />
                <ScrollToTopButton />
                <ScrollToTop />
              </ComboProvider>
            </ProductProvider>
          </CategoryProvider>
        </CartProvider>
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
