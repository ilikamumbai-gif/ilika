import { useEffect } from "react";

const SITE_URL = "https://ilika.in";
const DEFAULT_OG_IMAGE = `${SITE_URL}/Images/logo2.webp`;

const upsertMeta = (attribute, key, content) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertLink = (rel, href) => {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

export const useSeo = ({
  title,
  description,
  path = "/",
  canonical,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  robots = "index, follow",
  keywords,
}) => {
  useEffect(() => {
    const canonicalUrl = canonical
      ? new URL(canonical, SITE_URL).toString()
      : new URL(path, SITE_URL).toString();

    if (title) {
      document.title = title;
      upsertMeta("property", "og:title", title);
      upsertMeta("name", "twitter:title", title);
    }

    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
      upsertMeta("name", "twitter:description", description);
    }
    if (keywords) {
      upsertMeta("name", "keywords", Array.isArray(keywords) ? keywords.join(", ") : String(keywords));
    }

    upsertMeta("name", "robots", robots);
    upsertMeta("name", "application-name", "Ilika");
    upsertMeta("name", "apple-mobile-web-app-title", "Ilika");
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", "Ilika");
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", image);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:image", image);
    upsertLink("canonical", canonicalUrl);
  }, [canonical, description, image, keywords, path, robots, title, type]);
};
