/**
 * autoTrack.js — Track Events Automatically Without Code
 *
 * Attaches global listeners for:
 *   • Button / link clicks  (data-track-event, data-track-label)
 *   • Page scroll depth     (25 / 50 / 75 / 90 %)
 *   • Time on page          (10s / 30s / 60s)
 *   • Outbound link clicks
 *   • Form submissions
 *   • Video play events
 *   • Element visibility    (data-track-visible)
 *
 * Usage — just call initAutoTrack() once in your App:
 *   import { initAutoTrack } from "./utils/autoTrack";
 *   useEffect(() => initAutoTrack(), []);
 *
 * Zero-config: any element with data-track-event="..." fires that event.
 * Example:
 *   <button data-track-event="sign_up_click" data-track-label="hero_cta">
 *
 * All events are sent to:
 *   1) Meta Pixel (fbq)
 *   2) Google Analytics (gtag)  — if present
 *   3) A lightweight internal log stored in localStorage (last 100 events)
 */

// ── safe callers ───────────────────────────────────────────────
const fbq = (...args) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
};

const gtag = (...args) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
};

// ── internal event log ─────────────────────────────────────────
const MAX_LOG = 100;

export const getEventLog = () => {
  try {
    return JSON.parse(localStorage.getItem("at_event_log") || "[]");
  } catch {
    return [];
  }
};

const logEvent = (eventName, data = {}) => {
  try {
    const log = getEventLog();
    log.unshift({ event: eventName, ...data, ts: Date.now() });
    localStorage.setItem("at_event_log", JSON.stringify(log.slice(0, MAX_LOG)));
  } catch {}
};

// ── fire event everywhere ──────────────────────────────────────
export const fireEvent = (eventName, params = {}) => {
  const payload = { ...params, source: "auto_track" };

  // Meta Pixel
  fbq("trackCustom", eventName, payload);

  // Google Analytics
  gtag("event", eventName, payload);

  // Internal log
  logEvent(eventName, params);
};

// ── dedup helper ───────────────────────────────────────────────
const _fired = new Set();
const once = (key, fn) => {
  if (_fired.has(key)) return;
  _fired.add(key);
  fn();
};

// ══════════════════════════════════════════════════════════════
//  SCROLL DEPTH TRACKER
// ══════════════════════════════════════════════════════════════
const initScrollTracker = () => {
  const thresholds = [25, 50, 75, 90];

  const onScroll = () => {
    const scrolled =
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;

    thresholds.forEach((t) => {
      if (scrolled >= t) {
        once(`scroll_${t}`, () => {
          fireEvent("scroll_depth", { depth: `${t}%`, path: window.location.pathname });
        });
      }
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
};

// ══════════════════════════════════════════════════════════════
//  TIME ON PAGE TRACKER
// ══════════════════════════════════════════════════════════════
const initTimeTracker = () => {
  const milestones = [10_000, 30_000, 60_000];
  const timers = milestones.map((ms) =>
    setTimeout(() => {
      once(`time_${ms}`, () => {
        fireEvent("time_on_page", { seconds: ms / 1000, path: window.location.pathname });
      });
    }, ms)
  );

  return () => timers.forEach(clearTimeout);
};

// ══════════════════════════════════════════════════════════════
//  CLICK TRACKER — data-track-event on any element
// ══════════════════════════════════════════════════════════════
const initClickTracker = () => {
  const onClick = (e) => {
    // Walk up the DOM to find the nearest element with data-track-event
    let el = e.target;
    while (el && el !== document.body) {
      const eventName = el.dataset?.trackEvent;
      if (eventName) {
        fireEvent(eventName, {
          label: el.dataset?.trackLabel || el.innerText?.slice(0, 60) || "",
          path: window.location.pathname,
        });
        break;
      }
      el = el.parentElement;
    }

    // Outbound links
    const anchor = e.target.closest("a[href]");
    if (anchor) {
      const href = anchor.getAttribute("href") || "";
      const isOutbound =
        href.startsWith("http") && !href.includes(window.location.hostname);
      if (isOutbound) {
        fireEvent("outbound_link_click", {
          url: href,
          label: anchor.innerText?.slice(0, 60) || "",
          path: window.location.pathname,
        });
      }
    }
  };

  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
};

// ══════════════════════════════════════════════════════════════
//  FORM SUBMISSION TRACKER
// ══════════════════════════════════════════════════════════════
const initFormTracker = () => {
  const onSubmit = (e) => {
    const form = e.target;
    const name =
      form.dataset?.trackEvent ||
      form.getAttribute("name") ||
      form.getAttribute("id") ||
      "form_submit";

    fireEvent(name, {
      form_id: form.getAttribute("id") || "",
      path: window.location.pathname,
    });
  };

  document.addEventListener("submit", onSubmit, true);
  return () => document.removeEventListener("submit", onSubmit, true);
};

// ══════════════════════════════════════════════════════════════
//  VIDEO PLAY TRACKER
// ══════════════════════════════════════════════════════════════
const initVideoTracker = () => {
  const onPlay = (e) => {
    const video = e.target;
    if (video.tagName !== "VIDEO") return;
    once(`video_${video.src}`, () => {
      fireEvent("video_play", {
        src: video.src || video.currentSrc || "",
        path: window.location.pathname,
      });
    });
  };

  document.addEventListener("play", onPlay, true);
  return () => document.removeEventListener("play", onPlay, true);
};

// ══════════════════════════════════════════════════════════════
//  ELEMENT VISIBILITY TRACKER — data-track-visible="event_name"
// ══════════════════════════════════════════════════════════════
const initVisibilityTracker = () => {
  if (typeof IntersectionObserver === "undefined") return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const eventName = el.dataset?.trackVisible;
        if (!eventName) return;

        const key = `visible_${eventName}_${el.dataset?.trackLabel || ""}`;
        once(key, () => {
          fireEvent(eventName, {
            label: el.dataset?.trackLabel || "",
            path: window.location.pathname,
          });
        });

        observer.unobserve(el); // fire once per element
      });
    },
    { threshold: 0.5 }
  );

  const attach = () => {
    document
      .querySelectorAll("[data-track-visible]")
      .forEach((el) => observer.observe(el));
  };

  // Observe existing + future elements via MutationObserver
  attach();
  const mo = new MutationObserver(attach);
  mo.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    mo.disconnect();
  };
};

// ══════════════════════════════════════════════════════════════
//  MAIN INIT — call once in App.jsx
// ══════════════════════════════════════════════════════════════
export const initAutoTrack = () => {
  const cleanups = [
    initScrollTracker(),
    initTimeTracker(),
    initClickTracker(),
    initFormTracker(),
    initVideoTracker(),
    initVisibilityTracker(),
  ];

  // Reset per-page dedup keys on SPA route change
  const resetFired = () => {
    const keys = [..._fired].filter(
      (k) =>
        k.startsWith("scroll_") ||
        k.startsWith("time_")
    );
    keys.forEach((k) => _fired.delete(k));
  };

  window.addEventListener("popstate", resetFired);
  cleanups.push(() => window.removeEventListener("popstate", resetFired));

  // Return cleanup
  return () => cleanups.forEach((fn) => fn && fn());
};

export default initAutoTrack;
