Set one of these backend environment variables in your deployed API:

- `PRODUCT_PRERENDER_DEPLOY_HOOK_URL`
- `SITE_REBUILD_HOOK_URL`
- `VERCEL_DEPLOY_HOOK_URL`

Optional:

- `PRODUCT_PRERENDER_DEPLOY_HOOK_TOKEN`
- `SITE_REBUILD_HOOK_TOKEN`

Behavior:

- When a product is created, updated, or deleted, the backend will `POST` to the hook URL.
- That deploy should run the frontend build, including `npm run prerender:products`.
- The product API response includes `prerenderRebuild` so admin saves can be inspected if needed.

Example Vercel flow:

1. Create a Deploy Hook in Vercel for the frontend project.
2. Put that hook URL into the backend environment as `PRODUCT_PRERENDER_DEPLOY_HOOK_URL`.
3. Redeploy the backend once so the new env var is loaded.
