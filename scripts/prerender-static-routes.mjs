import fs from "node:fs/promises";
import path from "node:path";

const STATIC_ROUTES = [
  "/shopall",
  "/products",
  "/newarrival",
  "/offer",
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
  "/glow-therapy-combo",
  "/hydration-glow-combo",
  "/mask-combo",
  "/blog",
  "/about",
  "/about/why-ilika",
  "/about/quality-promise",
  "/about/ingredient-philosophy",
  "/contact",
  "/privacy",
  "/termsandcondition",
  "/return",
  "/shippingpolicy",
  "/faq",
  "/voice-mask-maker",
  "/nonvoice-mask-maker",
  "/leafless-hair-dryer",
  "/blackseed-hair-oil",
  "/herbal-hair-oil",
];

async function main() {
  const distDir = path.resolve(process.cwd(), "dist");
  const templatePath = path.join(distDir, "index.html");
  const templateHtml = await fs.readFile(templatePath, "utf8");

  let written = 0;

  for (const route of STATIC_ROUTES) {
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
