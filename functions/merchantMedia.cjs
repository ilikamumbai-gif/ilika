// Shared by the backend and the Firestore trigger (and included in Functions deploys).
const readUrl = (value) => typeof value === "string"
  ? value.trim()
  : String(value?.url || value?.image || value?.src || "").trim();

const toMediaUrl = (value, siteUrl) => {
  const raw = readUrl(value);
  if (!raw) return null;
  try {
    const url = new URL(raw, siteUrl);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return null;
    if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return null;
    url.hash = "";
    return url.href.length <= 2000 ? url : null;
  } catch {
    return null;
  }
};

const unique = (values) => [...new Set(values)];
const decodedPath = (url) => {
  try { return decodeURIComponent(url.pathname); } catch { return url.pathname; }
};
const videoExtension = /\.(mpg|mp4|wmv|avi|mov|flv|mpeg-1|mpegps)$/i;

const getMerchantMedia = (product = {}, variant = null, siteUrl = "https://ilika.in") => {
  const images = [
    ...(Array.isArray(variant?.images) ? variant.images : []),
    ...(Array.isArray(product.images) ? product.images : []),
    product.imageUrl,
    product.image,
  ];
  // Deduplicate after resolving relative URLs. Paths and signed query strings are case sensitive.
  const imageLinks = unique(images.map((value) => toMediaUrl(value, siteUrl))
    .filter((url) => url && !/\.(svg|mp4|webm|mov|avi|pdf)$/i.test(decodedPath(url)))
    .map((url) => url.href));

  const rejectedVideoLinks = [];
  // A video rejected by Google can remain on the storefront while being
  // excluded from future Merchant submissions. Match canonical YouTube IDs
  // too, since the website may store a Shorts or youtu.be URL.
  const videoKey = (value) => {
    const url = toMediaUrl(value, siteUrl);
    if (!url) return readUrl(value);
    const host = url.hostname.toLowerCase();
    const youtubeHosts = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"];
    const youtubeId = ["youtu.be", "www.youtu.be"].includes(host)
      ? url.pathname.split("/")[1]
      : youtubeHosts.includes(host)
        ? url.searchParams.get("v") || url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1]
        : "";
    return youtubeId ? `youtube:${youtubeId}` : url.href;
  };
  const excludedVideos = new Set(
    (Array.isArray(product.merchantExcludedVideoUrls) ? product.merchantExcludedVideoUrls : [])
      .map(videoKey)
  );
  const videoLinks = unique((Array.isArray(product.videos) ? product.videos : [])
    .filter((value) => !excludedVideos.has(videoKey(value)))
    .map((value) => {
      const raw = readUrl(value);
      if (!raw) return "";
      const url = toMediaUrl(raw, siteUrl);
      if (url) {
        const host = url.hostname.toLowerCase();
        let youtubeId = "";
        if (host === "youtu.be" || host === "www.youtu.be") {
          youtubeId = url.pathname.split("/")[1] || "";
        } else if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host)) {
          youtubeId = url.searchParams.get("v") || url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] || "";
        } else if (host !== "drive.google.com" && host !== "docs.google.com" && videoExtension.test(decodedPath(url))) {
          return url.href;
        }
        if (/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
          return `https://www.youtube.com/watch?v=${youtubeId}`;
        }
      }
      rejectedVideoLinks.push(raw);
      return "";
    }).filter(Boolean)).slice(0, 10);

  return {
    imageLink: imageLinks[0] || undefined,
    additionalImageLinks: imageLinks.length > 1 ? imageLinks.slice(1, 11) : undefined,
    videoLinks: videoLinks.length ? videoLinks : undefined,
    rejectedVideoLinks,
  };
};

module.exports = { getMerchantMedia };
