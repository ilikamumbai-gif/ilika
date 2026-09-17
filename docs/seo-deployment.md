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
