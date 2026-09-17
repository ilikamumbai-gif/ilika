import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

// Strict static serving for HTTP checks. Template mode boots clean SPA pages
// during prerendering, avoiding contamination from previously saved snapshots.
export async function startPreview({ template } = {}) {
  const root = path.resolve("dist");
  const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".xml": "application/xml", ".txt": "text/plain", ".json": "application/json" };
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      const file = path.resolve(root, `.${pathname}`);
      if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
      const extension = path.extname(file);
      if (template && !extension) { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end(template); return; }
      const target = extension ? file : path.join(file, "index.html");
      const data = await fs.readFile(target);
      res.setHeader("Content-Type", `${types[path.extname(target)] || "application/octet-stream"}; charset=utf-8`);
      res.end(data);
    } catch { res.writeHead(404).end("Not found"); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => server.close(resolve)) };
}
