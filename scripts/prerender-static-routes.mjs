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
  "/leafless-hair-dryer",
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

const LEAFLESS_HAIR_DRYER_HTML = `
<main id="prerendered-content" data-prerendered="leafless-hair-dryer">
  <article>
    <p>Ilika hair appliances</p>
    <h1>Ilika Leafless Hair Dryer</h1>
    <img src="/Images/HairdrayerCard.webp" alt="Ilika High-Speed BLDC Leafless Hair Dryer" />
    <p>Shop Ilika High-Speed BLDC Leafless Hair Dryer with a 110,000 RPM motor, ionic technology, intelligent temperature control and lightweight design for fast, smooth drying.</p>
    <p><strong>Price:</strong> ₹2,699 <span>MRP ₹3,499</span>. <strong>Availability:</strong> In stock. <strong>Warranty:</strong> 1-year warranty.</p>
    <h2>Features</h2><ul><li>110,000 RPM BLDC motor</li><li>Leafless airflow and ionic technology</li><li>Intelligent heat control</li><li>Lightweight styling design</li></ul>
    <h2>Specifications</h2><dl><dt>Controls</dt><dd>3 heat settings and 2 speed settings</dd><dt>Attachment</dt><dd>Concentrator nozzle</dd><dt>Cord</dt><dd>1.8 m, 360° swivel cord</dd><dt>Power</dt><dd>Standard Indian voltage (220 V)</dd></dl>
    <h2>FAQ</h2><h3>What is a leafless hair dryer?</h3><p>A leafless hair dryer uses a concealed motor and shaped air channel to create a smooth, focused airflow without exposed fan blades.</p><h3>Does this hair dryer have ionic technology?</h3><p>Yes. It is designed with ionic technology to support smoother-looking, less frizzy styling.</p>
  </article>
</main>`;

const injectLeaflessHairDryerSeo = (html) => html
  .replace(/<title>[\s\S]*?<\/title>/i, "<title>Ilika Leafless Hair Dryer – 110,000 RPM BLDC Ionic Hair Dryer</title>")
  .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, '<meta name="description" content="Shop Ilika High-Speed BLDC Leafless Hair Dryer with a 110,000 RPM motor, ionic technology, intelligent temperature control and lightweight design for fast, smooth drying." />')
  .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, '<link rel="canonical" href="https://ilika.in/leafless-hair-dryer" />')
  .replace(/<\/head>/i, '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Ilika High-Speed BLDC Leafless Hair Dryer","image":"https://ilika.in/ProductBanners/leafless-hair-dryer-banner-1.jpg","description":"Shop Ilika High-Speed BLDC Leafless Hair Dryer with a 110,000 RPM motor, ionic technology, intelligent temperature control and lightweight design for fast, smooth drying.","brand":{"@type":"Brand","name":"Ilika"},"sku":"ILIKA-BLDC-LEAFLESS-DRYER","offers":{"@type":"Offer","url":"https://ilika.in/leafless-hair-dryer","priceCurrency":"INR","price":"2699","availability":"https://schema.org/InStock"}}</script></head>');

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
    const isLeaflessHairDryer = route === "/leafless-hair-dryer";
    const content = isLeaflessHairDryer
      ? `<div id="root">${LEAFLESS_HAIR_DRYER_HTML}</div>`
      : crawlLinks ? `<div id="root"><main id="prerendered-content" data-prerendered="catalogue-links" hidden aria-hidden="true">${crawlLinks}</main></div>` : '<div id="root"></div>';
    const pageHtml = isLeaflessHairDryer ? injectLeaflessHairDryerSeo(templateHtml) : templateHtml;
    await fs.writeFile(path.join(routeDir, "index.html"), pageHtml.replace(/<div id="root"><\/div>/i, content), "utf8");
    written += 1;
  }

  console.log(`[prerender] Wrote ${written} route shell page(s) to dist/*/index.html`);
}

main().catch((err) => {
  console.error("[prerender] Failed:", err);
  process.exit(1);
});
