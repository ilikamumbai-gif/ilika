import fs from "node:fs/promises";
import path from "node:path";
import { buildBlogUrl } from "../src/utils/blogRoutes.js";

const readEnvFile = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return Object.fromEntries(
      raw.split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const separator = line.indexOf("=");
          return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "")];
        })
    );
  } catch {
    return {};
  }
};

const normalizeEndpoint = (url = "") => String(url || "").trim().replace(/\/+$/, "");
const apiBase = (url = "") => normalizeEndpoint(url).replace(/\/api\/(products|categories|blogs)$/i, "");

const getEndpoints = (env, resource) => Array.from(new Set([
  env.SITEMAP_API_URL,
  env.VITE_API_URL,
  env[`SITEMAP_${resource.toUpperCase()}_URL`],
].filter(Boolean).map(apiBase).map((base) => `${base}/api/${resource}`)));

const getList = (payload, key) =>
  Array.isArray(payload) ? payload : Array.isArray(payload?.[key]) ? payload[key] : Array.isArray(payload?.data) ? payload.data : [];

const slugify = (value = "") => String(value || "")
  .toLowerCase()
  .trim()
  .replace(/[^\w\s-]/g, "")
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-");

async function fetchList(endpoints, key) {
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) continue;
      return getList(await response.json(), key);
    } catch {
      continue;
    }
  }
  throw new Error(`[prerender] Could not fetch ${key} from any endpoint.`);
}

async function writeRoute(template, distDir, route) {
  const directory = path.join(distDir, route.replace(/^\/+/, ""));
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, "index.html"), template, "utf8");
}

async function main() {
  const cwd = process.cwd();
  const env = { ...await readEnvFile(path.join(cwd, ".env")), ...await readEnvFile(path.join(cwd, ".env.local")), ...process.env };
  const distDir = path.join(cwd, "dist");
  const template = await fs.readFile(path.join(distDir, "index.html"), "utf8");
  const [categories, blogs] = await Promise.all([
    fetchList(getEndpoints(env, "categories"), "categories"),
    fetchList(getEndpoints(env, "blogs"), "blogs"),
  ]);

  const categoryRoutes = categories
    .filter((category) => category?.isActive !== false && (category?.slug || category?.name))
    .map((category) => `/category/${slugify(category.slug || category.name)}`);
  const usedBlogPaths = new Set();
  const blogRoutes = blogs
    .filter((blog) => blog?.title && !blog?.isPrivate)
    .map((blog) => buildBlogUrl(blog, { usedPaths: usedBlogPaths }));

  for (const route of new Set([...categoryRoutes, ...blogRoutes])) {
    await writeRoute(template, distDir, route);
  }

  console.log(`[prerender] Wrote ${categoryRoutes.length} category and ${blogRoutes.length} blog page(s).`);
}

main().catch((error) => {
  console.error("[prerender] Failed:", error);
  process.exit(1);
});
