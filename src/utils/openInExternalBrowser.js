/**
 * openInExternalBrowser.js
 *
 * Detects whether the app is running inside Instagram or Facebook's
 * in-app browser and redirects to the device's default external browser
 * (Chrome on Android, Safari on iOS).
 *
 * Usage:
 *   import { isMetaInAppBrowser, openExternally } from '../utils/openInExternalBrowser';
 *
 *   // Auto-redirect on mount (e.g. in a landing page component):
 *   useEffect(() => { openExternally(); }, []);
 *
 *   // Or on a button / link click:
 *   <button onClick={() => openExternally('https://ilika.in/product/xyz')}>
 *     Shop Now
 *   </button>
 */

const ua = navigator.userAgent || '';

/** Returns true when running inside Instagram or Facebook in-app browser */
export function isMetaInAppBrowser() {
  return (
    ua.indexOf('Instagram') > -1 ||
    ua.indexOf('FBAN') > -1 ||
    ua.indexOf('FBAV') > -1 ||
    ua.indexOf('FB_IAB') > -1
  );
}

/**
 * Redirect the given URL (defaults to current page) to an external browser.
 * Safe to call even when NOT in a Meta browser — it simply does nothing.
 *
 * @param {string} [url] - URL to open. Defaults to window.location.href.
 */
export function openExternally(url) {
  if (!isMetaInAppBrowser()) return;

  const target = url || window.location.href;
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  if (isAndroid) {
    // intent:// scheme opens Chrome directly
    const stripped = target.replace(/^https?:\/\//, '');
    const intentUrl =
      'intent://' + stripped +
      '#Intent;scheme=https;package=com.android.chrome;end';
    window.location.replace(intentUrl);
    return;
  }

  if (isIOS) {
    // openExternalBrowser=1 is respected by newer Meta builds on iOS
    const sep = target.indexOf('?') === -1 ? '?' : '&';
    window.location.replace(target + sep + 'openExternalBrowser=1');
    return;
  }

  // Fallback for other platforms
  window.open(target, '_blank');
}
