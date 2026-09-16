import fs from "node:fs/promises";
import path from "node:path";
const STATIC_ROUTES = [
  "/",
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
  "/leafless-hair-dryer-landing",
  "/hair-dryer-guides",
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
  const crawlLinksPath = path.join(distDir, "_crawl-links.html");
  const crawlLinks = await fs.readFile(crawlLinksPath, "utf8").catch(() => "");

  let written = 0;

  for (const route of new Set(STATIC_ROUTES)) {
    const cleanRoute = route.replace(/^\/+/, "");
    const routeDir = path.join(distDir, cleanRoute);
    await fs.mkdir(routeDir, { recursive: true });
    // The catalogue is retained for crawlability, but React replaces this root
    // immediately on the client. Hiding the fallback prevents thousands of
    // links flashing on screen before the route UI renders.
    const isHairDryerLanding = route === "/leafless-hair-dryer-landing";
    const content = isHairDryerLanding
      ? '<div id="root"><main id="prerendered-content" data-prerendered="hair-dryer-landing"><h1>Ilika Leafless Hair Dryer</h1><p>High-speed BLDC motor, ionic technology and intelligent temperature control for fast, smooth drying.</p><p>Price: ₹2,699 (MRP ₹5,999)</p><a href="/product/leafless-hair-dryer">Shop Ilika Hair Dryer</a></main></div>'
      : crawlLinks ? `<div id="root"><main id="prerendered-content" data-prerendered="catalogue-links" hidden aria-hidden="true">${crawlLinks}</main></div>` : '<div id="root"></div>';
    const pageHtml = isHairDryerLanding
      ? templateHtml
        .replace(/<title>[\s\S]*?<\/title>/i, '<title>Ilika Leafless Hair Dryer – 110,000 RPM BLDC Ionic Hair Dryer</title>')
        .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, '<link rel="canonical" href="https://ilika.in/product/leafless-hair-dryer" />')
      : templateHtml;
    await fs.writeFile(path.join(routeDir, "index.html"), pageHtml.replace(/<div id="root"><\/div>/i, content), "utf8");
    written += 1;
  }

  console.log(`[prerender] Wrote ${written} route shell page(s) to dist/*/index.html`);
}

main().catch((err) => {
  console.error("[prerender] Failed:", err);
  process.exit(1);
});
