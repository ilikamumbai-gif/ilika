# ✅ Meta Pixel Fix — index.html

## Root Cause
Your `index.html` has `fbq('track', 'Purchase')` inside the base Meta Pixel
snippet. This fires a Purchase event on **every single page load** — home page,
product pages, blog, everywhere — completely poisoning your Meta Ads conversion data.

## Find and Replace in Your index.html

Find the Meta Pixel `<script>` block in your `<head>`. Delete the entire block
and replace it with this:

```html
<!-- ✅ CORRECT — Meta Pixel base snippet (no Purchase here) -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', '1188302548683614');
  fbq('track', 'PageView');

  /* ✅ NO fbq('track','Purchase') here.
     Purchase fires ONLY from CheckOut.jsx after a real confirmed order. */
</script>
<noscript>
  <img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=1188302548683614&ev=PageView&noscript=1"/>
</noscript>
```

## What Was Wrong (Before)
```html
<!-- ❌ WRONG — what causes the bug -->
fbq('init', '1188302548683614');
fbq('track', 'PageView');
fbq('track', 'Purchase');   ← THIS LINE fires on every page load
```

## What the Fixed Code Does
- `fbq('init', ...)` — initialises the pixel once ✅
- `fbq('track', 'PageView')` — fires on initial hard load ✅
- SPA PageView on route changes — handled by `PixelPageTracker` in `NavRoutes.jsx` ✅
- `Purchase` — fires ONLY from `CheckOut.jsx` after `trackPurchase()` is called
  with a real `orderId` from the order API response ✅

## Verification Steps After Deploying
1. Install **Meta Pixel Helper** Chrome extension
2. Open an incognito tab and browse your site (home, products, blog, etc.)
3. You should see **only PageView** events — zero Purchase events
4. Place a real test order through checkout
5. **Only then** should you see exactly one Purchase event fire
