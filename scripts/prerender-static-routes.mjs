import fs from "node:fs/promises";
import path from "node:path";
import { STATIC_BLOGS } from "../src/data/privateBlogs.js";
import { buildBlogUrl } from "../src/utils/blogRoutes.js";

const STATIC_ROUTES = [
  "/shopall",
  "/products",
  "/newarrival",
  "/offer",
  "/best-seller",
  "/skin",
  "/hair",
  "/grooming",
  "/skin/face",
  "/skin/body",
  "/hair/care",
  "/hair/styling",
  "/grooming/roller",
  "/grooming/face",
  "/grooming/remover",
  "/ctm",
  "/ctmkit",
  "/offers",
  "/glow-therapy-comb",
  "/hydration-glow-combo",
  "/mask-combo",
  "/blog",
  "/about",
  "/about/why-ilika",
  "/about/quality-promise",
  "/about/ingredient-philosophy",
  "/contact",
  "/feedback",
  "/warranty-registration",
  "/support-ticket",
  "/raise-complaint",
  "/warranty-claim",
  "/privacy",
  "/termsandcondition",
  "/return",
  "/shippingpolicy",
  "/faq",
  "/track-order",
  "/social-feed",
  "/knowskintype",
  "/voice-mask-maker",
  "/nonvoice-mask-maker",
  "/leafless-hair-dryer",
  "/high-frequency-therapy-wand",
  "/hot-cold-blackhead-remover",
  "/blackseed-hair-oil",
  "/herbal-hair-oil",
  "/gift-store",
  "/glow-therapy-combo",
  "/glow-therapy-comb",
  "/hydration-glow-combo",
  "/mask-combo",
  "/category/gifts-under-999",
  "/category/gifts-under-1499",
  "/category/gifts-under-2499",
  "/category/gifts-2999-plus",
  "/category/gifts-for-her",
  "/category/gifts-for-him",
  "/category/gifts-for-parents",
  "/category/gifts-for-special-occasion",
];

async function main() {
  const distDir = path.resolve(process.cwd(), "dist");
  const templatePath = path.join(distDir, "index.html");
  const templateHtml = await fs.readFile(templatePath, "utf8");

  let written = 0;

  const usedBlogPaths = new Set();
  const staticBlogRoutes = STATIC_BLOGS
    .filter((blog) => !blog?.isPrivate)
    .map((blog) => buildBlogUrl(blog, { usedPaths: usedBlogPaths }));

  for (const route of [...new Set([...STATIC_ROUTES, ...staticBlogRoutes])]) {
    const cleanRoute = route.replace(/^\/+/, "");
    const routeDir = path.join(distDir, cleanRoute);
    await fs.mkdir(routeDir, { recursive: true });
    await fs.writeFile(path.join(routeDir, "index.html"), templateHtml, "utf8");
    written += 1;
  }

  console.log(`[prerender] Wrote ${written} route shell page(s) to dist/*/index.html`);
}

main().catch((err) => {
  console.error("[prerender] Failed:", err);
  process.exit(1);
});
