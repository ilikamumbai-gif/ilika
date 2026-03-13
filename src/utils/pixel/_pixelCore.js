/**
 * _pixelCore.js — Pixel init ONLY
 */

const PIXEL_ID = "1188302548683614";

export const initPixel = () => {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;
  if (window._fbqInited) return;

  window._fbqInited = true;

  // 🔥 reset any previous queues
  window.fbq = undefined;
  window._fbq = undefined;

  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;

    n = f.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };

    if (!f._fbq) f._fbq = n;

    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];

    t = b.createElement(e);
    t.async = true;
    t.src = v;

    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js"
  );

  window.fbq("init", PIXEL_ID);
};

export const fbq = (...args) => {
  initPixel();
  if (window.fbq) {
    window.fbq(...args);
  }
};