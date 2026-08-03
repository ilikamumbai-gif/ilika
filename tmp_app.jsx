import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/App.jsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=05457ca4"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$();
import __vite__cjsImport1_react from "/node_modules/.vite/deps/react.js?v=05457ca4"; const React = __vite__cjsImport1_react.__esModule ? __vite__cjsImport1_react.default : __vite__cjsImport1_react; const Suspense = __vite__cjsImport1_react["Suspense"]; const lazy = __vite__cjsImport1_react["lazy"]; const useEffect = __vite__cjsImport1_react["useEffect"]; const useMemo = __vite__cjsImport1_react["useMemo"];
import { useLocation } from "/node_modules/.vite/deps/react-router-dom.js?v=05457ca4";
import { Toaster } from "/node_modules/.vite/deps/react-hot-toast.js?v=05457ca4";
import { AuthProvider } from "/src/context/AuthContext.jsx";
import { CartProvider } from "/src/context/CartProvider.jsx";
import { ProductProvider } from "/src/admin/context/ProductContext.jsx";
import { CategoryProvider } from "/src/admin/context/CategoryContext.jsx";
import { ComboProvider } from "/src/admin/context/ComboContext.jsx";
import { BannerProvider } from "/src/admin/context/BannerContext.jsx";
import CartStatusToast from "/src/components/CartStatusToast.jsx";
import ScrollToTop from "/src/components/ScrollToTop.jsx";
import NavRoutes from "/src/Routes/NavRoutes.jsx";
import { captureTrafficSource } from "/src/utils/tracking.js";
const EnquiryButton = lazy(_c = () => import("/src/components/EnquiryButton.jsx"));
_c2 = EnquiryButton;
const ScrollToTopButton = lazy(_c3 = () => import("/src/components/ScrollToTopButton.jsx"));
_c4 = ScrollToTopButton;
const AppContent = () => {
  _s();
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
      setTimeout(captureTrafficSource, 2e3);
    }
  }, []);
  useEffect(() => {
    if (isAdminRoute) return void 0;
    let cleanup;
    let cancelled = false;
    let fallbackTimer;
    const startTracking = () => {
      if (cancelled) return;
      import("/src/utils/autoTrack.js").then((mod) => {
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
        window.requestIdleCallback(startTracking, { timeout: 3e3 });
      } else {
        window.setTimeout(startTracking, 300);
      }
    };
    window.addEventListener("pointerdown", runOnce, { once: true, passive: true });
    window.addEventListener("keydown", runOnce, { once: true });
    window.addEventListener("scroll", runOnce, { once: true, passive: true });
    fallbackTimer = window.setTimeout(runOnce, 12e3);
    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("pointerdown", runOnce);
      window.removeEventListener("keydown", runOnce);
      window.removeEventListener("scroll", runOnce);
      if (typeof cleanup === "function") cleanup();
    };
  }, [isAdminRoute]);
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV(
      Toaster,
      {
        position: "top-left",
        containerStyle: {
          top: "90px",
          left: "20px",
          right: "20px",
          zIndex: 99999
        },
        toastOptions: {
          duration: 3e3,
          style: {
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: "20px",
            padding: "0px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.05)"
          }
        }
      },
      void 0,
      false,
      {
        fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
        lineNumber: 84,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen flex flex-col", children: /* @__PURE__ */ jsxDEV(CartProvider, { children: [
      !hideCartToast && /* @__PURE__ */ jsxDEV(CartStatusToast, {}, void 0, false, {
        fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
        lineNumber: 107,
        columnNumber: 30
      }, this),
      /* @__PURE__ */ jsxDEV(CategoryProvider, { children: /* @__PURE__ */ jsxDEV(ProductProvider, { children: /* @__PURE__ */ jsxDEV(ComboProvider, { children: /* @__PURE__ */ jsxDEV(BannerProvider, { children: [
        /* @__PURE__ */ jsxDEV(NavRoutes, {}, void 0, false, {
          fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
          lineNumber: 113,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ jsxDEV(Suspense, { fallback: null, children: [
          /* @__PURE__ */ jsxDEV(EnquiryButton, {}, void 0, false, {
            fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
            lineNumber: 116,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV(ScrollToTopButton, {}, void 0, false, {
            fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
            lineNumber: 117,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
          lineNumber: 115,
          columnNumber: 19
        }, this),
        /* @__PURE__ */ jsxDEV(ScrollToTop, {}, void 0, false, {
          fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
          lineNumber: 119,
          columnNumber: 19
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
        lineNumber: 112,
        columnNumber: 17
      }, this) }, void 0, false, {
        fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
        lineNumber: 111,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
        lineNumber: 110,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
        lineNumber: 109,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
      lineNumber: 106,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
      lineNumber: 105,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
    lineNumber: 83,
    columnNumber: 5
  }, this);
};
_s(AppContent, "UHbEKkxWGaQ/ttDEcPIB07SpoWo=", false, function() {
  return [useLocation];
});
_c5 = AppContent;
const App = () => {
  return /* @__PURE__ */ jsxDEV(AuthProvider, { children: /* @__PURE__ */ jsxDEV(AppContent, {}, void 0, false, {
    fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
    lineNumber: 133,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx",
    lineNumber: 132,
    columnNumber: 5
  }, this);
};
_c6 = App;
export default App;
var _c, _c2, _c3, _c4, _c5, _c6;
$RefreshReg$(_c, "EnquiryButton$lazy");
$RefreshReg$(_c2, "EnquiryButton");
$RefreshReg$(_c3, "ScrollToTopButton$lazy");
$RefreshReg$(_c4, "ScrollToTopButton");
$RefreshReg$(_c5, "AppContent");
$RefreshReg$(_c6, "App");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "C:/Users/Admin/OneDrive/Desktop/ilika-main/src/App.jsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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QUFBQTtBQUFBO0FBQUE7QUFBQSxXQW9CQTtBQUFBLE9BMUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0EyQ0E7QUFFSjtBQUFFSixHQTNHSUQsWUFBVTtBQUFBLFVBQ09sQixXQUFXO0FBQUE7QUFBQSxNQUQ1QmtCO0FBNkdOLE1BQU1vQyxNQUFNQSxNQUFNO0FBQ2hCLFNBQ0UsdUJBQUMsZ0JBQ0MsaUNBQUMsZ0JBQUQ7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUFXLEtBRGI7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUVBO0FBRUo7QUFBRUMsTUFOSUQ7QUFRTixlQUFlQTtBQUFJLElBQUF6QyxJQUFBQyxLQUFBRSxLQUFBQyxLQUFBdUMsS0FBQUQ7QUFBQSxhQUFBMUMsSUFBQTtBQUFBLGFBQUFDLEtBQUE7QUFBQSxhQUFBRSxLQUFBO0FBQUEsYUFBQUMsS0FBQTtBQUFBLGFBQUF1QyxLQUFBO0FBQUEsYUFBQUQsS0FBQSIsIm5hbWVzIjpbIlJlYWN0IiwiU3VzcGVuc2UiLCJsYXp5IiwidXNlRWZmZWN0IiwidXNlTWVtbyIsInVzZUxvY2F0aW9uIiwiVG9hc3RlciIsIkF1dGhQcm92aWRlciIsIkNhcnRQcm92aWRlciIsIlByb2R1Y3RQcm92aWRlciIsIkNhdGVnb3J5UHJvdmlkZXIiLCJDb21ib1Byb3ZpZGVyIiwiQmFubmVyUHJvdmlkZXIiLCJDYXJ0U3RhdHVzVG9hc3QiLCJTY3JvbGxUb1RvcCIsIk5hdlJvdXRlcyIsImNhcHR1cmVUcmFmZmljU291cmNlIiwiRW5xdWlyeUJ1dHRvbiIsIl9jIiwiX2MyIiwiU2Nyb2xsVG9Ub3BCdXR0b24iLCJfYzMiLCJfYzQiLCJBcHBDb250ZW50IiwiX3MiLCJwYXRobmFtZSIsImlzQWRtaW5Sb3V0ZSIsInN0YXJ0c1dpdGgiLCJoaWRlQ2FydFRvYXN0Iiwid2luZG93IiwicmVxdWVzdElkbGVDYWxsYmFjayIsInNldFRpbWVvdXQiLCJ1bmRlZmluZWQiLCJjbGVhbnVwIiwiY2FuY2VsbGVkIiwiZmFsbGJhY2tUaW1lciIsInN0YXJ0VHJhY2tpbmciLCJ0aGVuIiwibW9kIiwiaW5pdEF1dG9UcmFjayIsInJ1bk9uY2UiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwidGltZW91dCIsImFkZEV2ZW50TGlzdGVuZXIiLCJvbmNlIiwicGFzc2l2ZSIsImNsZWFyVGltZW91dCIsInRvcCIsImxlZnQiLCJyaWdodCIsInpJbmRleCIsImR1cmF0aW9uIiwic3R5bGUiLCJiYWNrZ3JvdW5kIiwiYmFja2Ryb3BGaWx0ZXIiLCJib3JkZXJSYWRpdXMiLCJwYWRkaW5nIiwiYm94U2hhZG93IiwiYm9yZGVyIiwiQXBwIiwiX2M2IiwiX2M1Il0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkFwcC5qc3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IFN1c3BlbnNlLCBsYXp5LCB1c2VFZmZlY3QsIHVzZU1lbW8gfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IHVzZUxvY2F0aW9uIH0gZnJvbSBcInJlYWN0LXJvdXRlci1kb21cIjtcbmltcG9ydCB7IFRvYXN0ZXIgfSBmcm9tIFwicmVhY3QtaG90LXRvYXN0XCI7XG5cbmltcG9ydCB7IEF1dGhQcm92aWRlciB9IGZyb20gXCIuL2NvbnRleHQvQXV0aENvbnRleHRcIjtcbmltcG9ydCB7IENhcnRQcm92aWRlciB9IGZyb20gXCIuL2NvbnRleHQvQ2FydFByb3ZpZGVyXCI7XG5pbXBvcnQgeyBQcm9kdWN0UHJvdmlkZXIgfSBmcm9tIFwiLi9hZG1pbi9jb250ZXh0L1Byb2R1Y3RDb250ZXh0XCI7XG5pbXBvcnQgeyBDYXRlZ29yeVByb3ZpZGVyIH0gZnJvbSBcIi4vYWRtaW4vY29udGV4dC9DYXRlZ29yeUNvbnRleHRcIjtcbmltcG9ydCB7IENvbWJvUHJvdmlkZXIgfSBmcm9tIFwiLi9hZG1pbi9jb250ZXh0L0NvbWJvQ29udGV4dFwiO1xuaW1wb3J0IHsgQmFubmVyUHJvdmlkZXIgfSBmcm9tIFwiLi9hZG1pbi9jb250ZXh0L0Jhbm5lckNvbnRleHRcIjtcblxuaW1wb3J0IENhcnRTdGF0dXNUb2FzdCBmcm9tIFwiLi9jb21wb25lbnRzL0NhcnRTdGF0dXNUb2FzdFwiO1xuaW1wb3J0IFNjcm9sbFRvVG9wIGZyb20gXCIuL2NvbXBvbmVudHMvU2Nyb2xsVG9Ub3BcIjtcbmltcG9ydCBOYXZSb3V0ZXMgZnJvbSBcIi4vUm91dGVzL05hdlJvdXRlc1wiO1xuXG5pbXBvcnQgeyBjYXB0dXJlVHJhZmZpY1NvdXJjZSB9IGZyb20gXCIuL3V0aWxzL3RyYWNraW5nXCI7XG5cbmNvbnN0IEVucXVpcnlCdXR0b24gPSBsYXp5KCgpID0+IGltcG9ydChcIi4vY29tcG9uZW50cy9FbnF1aXJ5QnV0dG9uXCIpKTtcbmNvbnN0IFNjcm9sbFRvVG9wQnV0dG9uID0gbGF6eSgoKSA9PiBpbXBvcnQoXCIuL2NvbXBvbmVudHMvU2Nyb2xsVG9Ub3BCdXR0b25cIikpO1xuXG5jb25zdCBBcHBDb250ZW50ID0gKCkgPT4ge1xuICBjb25zdCB7IHBhdGhuYW1lIH0gPSB1c2VMb2NhdGlvbigpO1xuXG4gIGNvbnN0IGlzQWRtaW5Sb3V0ZSA9IHVzZU1lbW8oKCkgPT4gcGF0aG5hbWUuc3RhcnRzV2l0aChcIi9hZG1pblwiKSwgW3BhdGhuYW1lXSk7XG4gIGNvbnN0IGhpZGVDYXJ0VG9hc3QgPSB1c2VNZW1vKFxuICAgICgpID0+IHBhdGhuYW1lID09PSBcIi9ibG9nXCIgfHwgcGF0aG5hbWUuc3RhcnRzV2l0aChcIi9ibG9nL1wiKSxcbiAgICBbcGF0aG5hbWVdXG4gICk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoXCJyZXF1ZXN0SWRsZUNhbGxiYWNrXCIgaW4gd2luZG93KSB7XG4gICAgICByZXF1ZXN0SWRsZUNhbGxiYWNrKCgpID0+IGNhcHR1cmVUcmFmZmljU291cmNlKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRUaW1lb3V0KGNhcHR1cmVUcmFmZmljU291cmNlLCAyMDAwKTtcbiAgICB9XG4gIH0sIFtdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChpc0FkbWluUm91dGUpIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgICBsZXQgY2xlYW51cDtcbiAgICBsZXQgY2FuY2VsbGVkID0gZmFsc2U7XG4gICAgbGV0IGZhbGxiYWNrVGltZXI7XG5cbiAgICBjb25zdCBzdGFydFRyYWNraW5nID0gKCkgPT4ge1xuICAgICAgaWYgKGNhbmNlbGxlZCkgcmV0dXJuO1xuICAgICAgaW1wb3J0KFwiLi91dGlscy9hdXRvVHJhY2tcIikudGhlbigobW9kKSA9PiB7XG4gICAgICAgIGlmIChjYW5jZWxsZWQpIHJldHVybjtcbiAgICAgICAgY2xlYW51cCA9IG1vZC5pbml0QXV0b1RyYWNrKCk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uc3QgcnVuT25jZSA9ICgpID0+IHtcbiAgICAgIGlmIChjYW5jZWxsZWQpIHJldHVybjtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgcnVuT25jZSk7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgcnVuT25jZSk7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCBydW5PbmNlKTtcblxuICAgICAgaWYgKFwicmVxdWVzdElkbGVDYWxsYmFja1wiIGluIHdpbmRvdykge1xuICAgICAgICB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFjayhzdGFydFRyYWNraW5nLCB7IHRpbWVvdXQ6IDMwMDAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3aW5kb3cuc2V0VGltZW91dChzdGFydFRyYWNraW5nLCAzMDApO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIHJ1bk9uY2UsIHsgb25jZTogdHJ1ZSwgcGFzc2l2ZTogdHJ1ZSB9KTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgcnVuT25jZSwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIHJ1bk9uY2UsIHsgb25jZTogdHJ1ZSwgcGFzc2l2ZTogdHJ1ZSB9KTtcblxuICAgIGZhbGxiYWNrVGltZXIgPSB3aW5kb3cuc2V0VGltZW91dChydW5PbmNlLCAxMjAwMCk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgY2FuY2VsbGVkID0gdHJ1ZTtcbiAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoZmFsbGJhY2tUaW1lcik7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIHJ1bk9uY2UpO1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHJ1bk9uY2UpO1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgcnVuT25jZSk7XG4gICAgICBpZiAodHlwZW9mIGNsZWFudXAgPT09IFwiZnVuY3Rpb25cIikgY2xlYW51cCgpO1xuICAgIH07XG4gIH0sIFtpc0FkbWluUm91dGVdKTtcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8VG9hc3RlclxuICAgICAgICBwb3NpdGlvbj1cInRvcC1sZWZ0XCJcbiAgICAgICAgY29udGFpbmVyU3R5bGU9e3tcbiAgICAgICAgICB0b3A6IFwiOTBweFwiLFxuICAgICAgICAgIGxlZnQ6IFwiMjBweFwiLFxuICAgICAgICAgIHJpZ2h0OiBcIjIwcHhcIixcbiAgICAgICAgICB6SW5kZXg6IDk5OTk5LFxuICAgICAgICB9fVxuICAgICAgICB0b2FzdE9wdGlvbnM9e3tcbiAgICAgICAgICBkdXJhdGlvbjogMzAwMCxcbiAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogXCJyZ2JhKDI1NSwyNTUsMjU1LDAuOTUpXCIsXG4gICAgICAgICAgICBiYWNrZHJvcEZpbHRlcjogXCJibHVyKDEycHgpXCIsXG4gICAgICAgICAgICBib3JkZXJSYWRpdXM6IFwiMjBweFwiLFxuICAgICAgICAgICAgcGFkZGluZzogXCIwcHhcIixcbiAgICAgICAgICAgIGJveFNoYWRvdzogXCIwIDEwcHggMzBweCByZ2JhKDAsMCwwLDAuMDgpXCIsXG4gICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkIHJnYmEoMCwwLDAsMC4wNSlcIixcbiAgICAgICAgICB9LFxuICAgICAgICB9fVxuICAgICAgLz5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJtaW4taC1zY3JlZW4gZmxleCBmbGV4LWNvbFwiPlxuICAgICAgICA8Q2FydFByb3ZpZGVyPlxuICAgICAgICAgIHshaGlkZUNhcnRUb2FzdCAmJiA8Q2FydFN0YXR1c1RvYXN0IC8+fVxuXG4gICAgICAgICAgPENhdGVnb3J5UHJvdmlkZXI+XG4gICAgICAgICAgICA8UHJvZHVjdFByb3ZpZGVyPlxuICAgICAgICAgICAgICA8Q29tYm9Qcm92aWRlcj5cbiAgICAgICAgICAgICAgICA8QmFubmVyUHJvdmlkZXI+XG4gICAgICAgICAgICAgICAgICA8TmF2Um91dGVzIC8+XG5cbiAgICAgICAgICAgICAgICAgIDxTdXNwZW5zZSBmYWxsYmFjaz17bnVsbH0+XG4gICAgICAgICAgICAgICAgICAgIDxFbnF1aXJ5QnV0dG9uIC8+XG4gICAgICAgICAgICAgICAgICAgIDxTY3JvbGxUb1RvcEJ1dHRvbiAvPlxuICAgICAgICAgICAgICAgICAgPC9TdXNwZW5zZT5cbiAgICAgICAgICAgICAgICAgIDxTY3JvbGxUb1RvcCAvPlxuICAgICAgICAgICAgICAgIDwvQmFubmVyUHJvdmlkZXI+XG4gICAgICAgICAgICAgIDwvQ29tYm9Qcm92aWRlcj5cbiAgICAgICAgICAgIDwvUHJvZHVjdFByb3ZpZGVyPlxuICAgICAgICAgIDwvQ2F0ZWdvcnlQcm92aWRlcj5cbiAgICAgICAgPC9DYXJ0UHJvdmlkZXI+XG4gICAgICA8L2Rpdj5cbiAgICA8Lz5cbiAgKTtcbn07XG5cbmNvbnN0IEFwcCA9ICgpID0+IHtcbiAgcmV0dXJuIChcbiAgICA8QXV0aFByb3ZpZGVyPlxuICAgICAgPEFwcENvbnRlbnQgLz5cbiAgICA8L0F1dGhQcm92aWRlcj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEFwcDtcbiJdLCJmaWxlIjoiQzovVXNlcnMvQWRtaW4vT25lRHJpdmUvRGVza3RvcC9pbGlrYS1tYWluL3NyYy9BcHAuanN4In0=