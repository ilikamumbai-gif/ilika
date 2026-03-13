/**
 * _pixelCore.js — Pixel init ONLY. No events here.
 * Import this in other pixel files, never directly in components.
 */
const PIXEL_ID = '1188302548683614';

export const initPixel = () => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;
  if (window._fbqInited) return;
  window._fbqInited = true;

  window._fbq = window._fbq || {};
  window._fbq.disablePushState = true;
  window._fbq.autoConfig = false;

  if (!window.fbq) {
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return;
      n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
      t=b.createElement(e);t.async=!0;t.src=v;
      s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  }

  window.fbq('set',  'autoConfig', false, PIXEL_ID);
  window.fbq('init', PIXEL_ID);
};

export const fbq = (...args) => {
  initPixel();
  if (window.fbq && typeof window.fbq === 'function') {
    window.fbq(...args);
  }
};