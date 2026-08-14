import { legacyProductRedirects } from "./legacy-product-redirects.js";

const normalizeLegacyPath = (value) =>
  String(value || "")
    .replace(/^\/+/, "")
    .trim()
    .toLowerCase();

const isLocalPath = (value) => typeof value === "string" && /^\/(?!\/)/.test(value);

export default function handler(req, res) {
  const legacyPath = normalizeLegacyPath(req.query?.path);
  const destination = legacyProductRedirects[legacyPath];

  if (isLocalPath(destination)) {
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    res.redirect(301, destination);
    return;
  }

  res.setHeader("Cache-Control", "public, max-age=600, s-maxage=600");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.status(404).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow, noarchive" />
  <title>404 Not Found</title>
</head>
<body>
  <main>
    <h1>404 Not Found</h1>
    <p>The requested resource could not be found.</p>
  </main>
</body>
</html>`);
}
