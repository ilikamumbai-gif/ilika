# ⚠️ CRITICAL FIX — index.html Meta Pixel Snippet

## The Bug
Your `index.html` currently has `fbq('track', 'Purchase')` inside the Meta Pixel
base code snippet. This fires a Purchase event on **every single page load**,
poisoning all your Meta Ads conversion data.

## Find This in Your index.html
Look for the Meta Pixel `<script>` block in your `<head>`. It probably looks like:

```html
<!-- WRONG — what you have now -->
<script>
  !function(f,b,e,v,n,t,s){...}(window,...,'fbevents.js');
  fbq('init', '1188302548683614');
  fbq('track', 'PageView');
  fbq('track', 'Purchase');   ← DELETE THIS LINE
</script>
```

## The Fix — Replace With This Exactly

```html
<!-- CORRECT — paste this into your <head> -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');

  fbq('track', 'PageView');
  /* ✅ NO Purchase here. Purchase is fired ONLY from CheckOut.jsx after order confirmation. */
</script>
<noscript>
  <img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=1188302548683614&ev=PageView&noscript=1"/>
</noscript>
```

## What Changed
- Removed `fbq('track', 'Purchase')` from the base snippet
- Purchase is now fired ONLY from `CheckOut.jsx` after a real order is confirmed
- The React app handles SPA PageView tracking via `PixelPageTracker` in `NavRoutes.jsx`

## After Fixing index.html
1. Deploy the updated `index.html`
2. Deploy the updated `src/` files from `src_fixed.zip`
3. Open Meta Pixel Helper in an incognito tab and browse your site
4. You should see ONLY `PageView` events while browsing — zero `Purchase` events
5. Place a test order — ONLY THEN should Purchase fire, once
