const clampStatus = (value) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return parsed === 410 ? 410 : 404;
};

const STATUS_COPY = {
  404: {
    title: "404 Not Found",
    message: "The requested resource could not be found.",
  },
  410: {
    title: "410 Gone",
    message: "The requested resource is no longer available.",
  },
};

export default function handler(req, res) {
  const status = clampStatus(req.query?.status);
  const payload = STATUS_COPY[status] || STATUS_COPY[404];

  res.setHeader("Cache-Control", "public, max-age=600, s-maxage=600");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  res.status(status).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow, noarchive" />
  <title>${payload.title}</title>
</head>
<body>
  <main>
    <h1>${payload.title}</h1>
    <p>${payload.message}</p>
  </main>
</body>
</html>`);
}
