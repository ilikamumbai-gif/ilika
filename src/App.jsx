import React, { Suspense, lazy, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartProvider";
import { ProductProvider } from "./admin/context/ProductContext";
import { CategoryProvider } from "./admin/context/CategoryContext";
import { ComboProvider } from "./admin/context/ComboContext";
import { BannerProvider } from "./admin/context/BannerContext";

import CartStatusToast from "./components/CartStatusToast";
import ScrollToTop from "./components/ScrollToTop";
import NavRoutes from "./Routes/NavRoutes";

import { captureTrafficSource } from "./utils/tracking";

const EnquiryButton = lazy(() => import("./components/EnquiryButton"));
const ScrollToTopButton = lazy(() => import("./components/ScrollToTopButton"));

const AppContent = () => {
  const { pathname } = useLocation();

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
    let fallbackTimer;

    const startTracking = () => {
      if (cancelled) return;
      import("./utils/autoTrack").then((mod) => {
        if (cancelled) return;
        cleanup = mod.initAutoTrack();
      });
    };

    const runOnce = () => {
      if (cancelled) return;
      window.removeEventListener("pointerdown", runOnce);
      window.removeEventListener("keydown", runOnce);
      window.removeEventListener("scroll", runOnce);

      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(startTracking, { timeout: 3000 });
      } else {
        window.setTimeout(startTracking, 300);
      }
    };

    window.addEventListener("pointerdown", runOnce, { once: true, passive: true });
    window.addEventListener("keydown", runOnce, { once: true });
    window.addEventListener("scroll", runOnce, { once: true, passive: true });

    fallbackTimer = window.setTimeout(runOnce, 12000);

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("pointerdown", runOnce);
      window.removeEventListener("keydown", runOnce);
      window.removeEventListener("scroll", runOnce);
      if (typeof cleanup === "function") cleanup();
    };
  }, [isAdminRoute]);

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
                <BannerProvider>
                  <NavRoutes />

                  <Suspense fallback={null}>
                    <EnquiryButton />
                    <ScrollToTopButton />
                  </Suspense>
                  <ScrollToTop />
                </BannerProvider>
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
