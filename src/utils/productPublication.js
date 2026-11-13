const escapeAttribute = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

export const getProductPublicationVersion = (product = {}) => {
  const value = product.updatedAt ?? product.createdAt ?? "";
  if (typeof value?.toMillis === "function") return String(value.toMillis());
  if (typeof value === "object" && value !== null) {
    const seconds = value._seconds ?? value.seconds;
    if (seconds !== undefined) return String(Number(seconds) * 1000 + Math.floor(Number(value._nanoseconds ?? value.nanoseconds ?? 0) / 1e6));
  }
  return String(value);
};

export const getProductPublicationMarker = (product = {}) =>
  `data-product-id="${escapeAttribute(product.docId || product.id || "")}" data-product-version="${escapeAttribute(getProductPublicationVersion(product))}"`;

export const isPublishedProductCurrent = (html, product) =>
  Boolean(String(html).match(/<main\b[^>]*>/i)?.[0].includes(getProductPublicationMarker(product)));
