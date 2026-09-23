# SEO build and release

Run `npm ci` and `npm run build` with Node 22+ and the production `VITE_API_URL` configured. The build fetches the public catalog, generates the sitemap, renders product and article HTML, and uses Playwright Chromium to capture the actual remaining public pages. It fails when content, metadata, API requests, or canonicals are invalid. Everyone receives the same HTML; React provides interactivity after loading.

Chromium is installed by the prerender command. Linux build images must also supply its system libraries (`npx playwright install --with-deps chromium` during CI setup). Cache the Playwright browser directory to avoid downloading it on every build. Builds need network access to the public API and the browser download host on first use.

`npm run verify:indexability` checks all sitemap pages. `npm run verify:footer` performs HTTP requests, browser clicks without JavaScript, mobile footer expansion, and React navigation checks. Run both after building. Vercel serves the generated `dist` directory with clean URLs. Do not replace generated route files with an unconditional SPA rewrite.

The renderer dismisses timed offer popups before saving HTML, so visitors without JavaScript can use page links. It blocks form submissions and analytics while capturing pages. Product records without a valid `productUrl` are reported by the build and must be corrected in the catalog before they can have indexable product pages.

Catalog/content updates require a rebuild. The backend supports `PRODUCT_PRERENDER_DEPLOY_HOOK_URL` / `SITE_REBUILD_HOOK_URL`; configure the appropriate deployment hook for product changes and trigger deployments after blog or policy edits as well.

After deploying:

1. Fetch `https://ilika.in/`, a product, a blog, and a policy with `curl`. Confirm page content, navigation, unique metadata, and canonicals in the raw response.
2. Confirm `/sitemap.xml` and `/robots.txt` return 200 and unknown URLs return 404.
3. In the verified Google Search Console property, open Sitemaps and submit `https://ilika.in/sitemap.xml`. Use URL Inspection on the homepage and priority product pages, then request indexing.

Search Console submission and live deployment are separate authenticated operations; a successful local build does not perform either operation or guarantee indexing/ranking changes.

The `/blog` page links to the dedicated `/articles` directory in its initial HTML. The directory contains every public article link, with Ilika-prefixed link titles. The catalog renderer creates both pages, and the Chromium-unavailable fallback preserves them. When Chromium is available, it captures the React pages using the same public-article filter. `verify:indexability` fails if the blog-to-directory link or any directory-to-article link is missing from the initial HTML. New API articles enter the initial HTML on the next rebuild. Run `node scripts/verify-blog-index.mjs` to check this navigation with and without JavaScript.

## September 2026 SEO review

The home offer waits eight seconds, has a 48px mobile close target, and records that it was shown in sessionStorage before opening. Reloading or navigating within the same tab session does not show it again. If session storage is unavailable, the automatic offer stays suppressed.

82 reviewed city articles (74 repository articles and eight API articles) are consolidated into `/blog/hair-dryer-pricing-delivery-india` and `/blog/face-mask-maker-pricing-delivery-india`. `src/data/blogConsolidation.js` records the exact retired slugs; `vercel.json` contains explicit HTTP 301 redirects, including trailing slash variants. The original source records remain available, but retired articles are excluded from public sitemap generation and prerendering. Do not republish these city variants. Add useful product-specific details to the two guides instead.

Run `node --test scripts/generate-sitemap.test.mjs scripts/product-seo.test.mjs`, `npm run build`, and `node scripts/verify-seo-review.mjs`. The last check verifies the consolidated sitemap, guide content, lip plumper HTML, mobile popup delay, tap target and session suppression. On Windows environments that need the system certificate store, set `NODE_OPTIONS=--use-system-ca` for the build; do not disable TLS verification.

The lip plumper title, description and visible FAQs now target “lip plumper tool”. After deployment, verify `/product/lip-plumper-vacuum-device` in Search Console URL Inspection: check the indexed status, Google-selected canonical and last crawl, run the live test, then request indexing if appropriate. HTTP 200, crawlable HTML and sitemap inclusion establish technical eligibility, not confirmed Google indexing or recovered rankings. Check query performance separately for ranking recovery.

After deploying, request a retired URL such as `/blog/hair-dryer-price-drop-mumbai-400013` and confirm HTTP 301 with a Location header pointing directly to the hair dryer guide. Confirm both destination guides return 200. These redirects require the Vercel deployment; client-side navigation alone cannot issue HTTP 301.
