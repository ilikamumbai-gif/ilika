import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WATCH_VIDEOS, getWatchPath, getVideoSchema, getVideoThumbnail, getVideoEmbed } from "../src/data/watchVideos.js";
import { escapeVideoHtml as escape, renderWatchContent, renderVideoLibrary, VIDEO_LIBRARY_TITLE, VIDEO_LIBRARY_DESCRIPTION } from "../src/utils/videoPages.js";

export function buildVideoHtml(template, video = null) {
  const pagePath = video ? getWatchPath(video) : "/videos";
  const canonical = `https://ilika.in${pagePath}`;
  const title = `${video ? video.title : VIDEO_LIBRARY_TITLE} | Ilika`;
  const description = video?.description || VIDEO_LIBRARY_DESCRIPTION;
  const image = video ? getVideoThumbnail(video) : "https://ilika.in/Images/logo2.webp";
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escape(title)}</title>`)
    .replace(/<link\s+rel="canonical"[^>]*>/i, () => `<link rel="canonical" href="${canonical}" />`);
  for (const [attr, name, value] of [
    ["name", "description", description], ["name", "robots", "index, follow"],
    ["property", "og:title", title], ["property", "og:description", description],
    ["property", "og:url", canonical], ["property", "og:image", image],
    ["property", "og:type", video ? "video.other" : "website"],
    ["name", "twitter:title", title], ["name", "twitter:description", description],
    ["name", "twitter:image", image], ["name", "twitter:card", "summary_large_image"],
  ]) {
    const tag = `<meta ${attr}="${name}" content="${escape(value)}" />`;
    const pattern = new RegExp(`<meta\\s+${attr}="${name}"[^>]*>`, "i");
    html = pattern.test(html) ? html.replace(pattern, () => tag) : html.replace("</head>", () => `${tag}</head>`);
  }
  if (video) html = html.replace("</head>", () => `<script type="application/ld+json">${JSON.stringify(getVideoSchema(video)).replace(/</g, "\\u003c")}</script></head>`);
  const header = '<header class="border-b border-gray-200 px-4 py-4"><nav class="mx-auto flex max-w-5xl gap-6" aria-label="Main"><a href="/" class="text-xl font-bold">Ilika</a><a href="/videos">Videos</a><a href="/products">Shop products</a></nav></header>';
  const footer = '<footer class="border-t border-gray-200 px-4 py-6"><nav class="mx-auto flex max-w-5xl flex-wrap gap-5" aria-label="Footer"><a href="/">Home</a><a href="/videos">Videos</a><a href="/products">Products</a><a href="/contact">Contact</a><a href="/privacy">Privacy Policy</a><a href="/sitemap.html">Sitemap</a></nav></footer>';
  return html.replace('<div id="root"></div>', () => `<div id="root">${header}${video ? renderWatchContent(video) : renderVideoLibrary()}${footer}</div>`);
}

export const buildVideoSitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${WATCH_VIDEOS.map((video) => `  <url><loc>https://ilika.in${getWatchPath(video)}</loc><video:video>
    <video:thumbnail_loc>${escape(getVideoThumbnail(video))}</video:thumbnail_loc>
    <video:title>${escape(video.title)}</video:title>
    <video:description>${escape(video.description)}</video:description>
    ${video.youtubeId ? `<video:player_loc>${escape(getVideoEmbed(video))}</video:player_loc>` : `<video:content_loc>${escape(video.contentUrl)}</video:content_loc>`}
    <video:publication_date>${escape(video.uploadDate)}</video:publication_date>
  </video:video></url>`).join("\n")}
</urlset>\n`;

async function main() {
  const template = await fs.readFile("dist/index.html", "utf8");
  for (const video of [null, ...WATCH_VIDEOS]) {
    const directory = path.join("dist", video ? getWatchPath(video) : "/videos");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, "index.html"), buildVideoHtml(template, video));
  }
  await fs.writeFile("dist/video-sitemap.xml", buildVideoSitemap());
  console.log(`[videos] Wrote ${WATCH_VIDEOS.length} watch pages, video library and video sitemap.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error("[videos] Failed:", error); process.exitCode = 1; });
}
