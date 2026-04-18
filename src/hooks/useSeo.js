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
  image = DEFAULT_OG_IMAGE,
  type = "website",
  jsonLd,
  robots = "index, follow",
}) => {
  useEffect(() => {
    const canonicalUrl = new URL(path, SITE_URL).toString();

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

    upsertMeta("name", "robots", robots);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", image);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:image", image);
    upsertLink("canonical", canonicalUrl);

    let schemaEl;
    if (jsonLd) {
      schemaEl = document.createElement("script");
      schemaEl.type = "application/ld+json";
      schemaEl.id = "dynamic-seo-jsonld";
      schemaEl.text = JSON.stringify(jsonLd);
      document.head.appendChild(schemaEl);
    }

    return () => {
      if (schemaEl?.parentNode) {
        schemaEl.parentNode.removeChild(schemaEl);
      }
    };
  }, [description, image, jsonLd, path, robots, title, type]);
};
