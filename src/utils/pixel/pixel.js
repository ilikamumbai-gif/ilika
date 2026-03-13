const PIXEL_ID = "1188302548683614";

export const initPixel = () => {
  if (typeof window === "undefined") return;
  if (window.fbq && window.fbq.loaded) return;

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

  window.fbq("init", PIXEL_ID, {}, {
    agent: "plwebsite"  // identifies manual setup, suppresses auto-event scanning
  });

  // Disable automatic event detection after init
  window.fbq("set", "agent", "plwebsite", PIXEL_ID);
};

export const fbq = (...args) => {
  initPixel();
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(...args);
  }
};