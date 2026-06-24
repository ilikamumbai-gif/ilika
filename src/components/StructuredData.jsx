import React from "react";

const readComparableId = (item = {}) =>
  String(item?.["@id"] || item?.url || "")
    .trim()
    .toLowerCase();

const hasExistingStructuredData = (item) => {
  if (typeof document === "undefined") return false;

  const targetType = String(item?.["@type"] || "").trim().toLowerCase();
  const targetId = readComparableId(item);

  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent || "{}");
      const entries = Array.isArray(parsed) ? parsed : [parsed];

      for (const entry of entries) {
        const entryType = String(entry?.["@type"] || "").trim().toLowerCase();
        const entryId = readComparableId(entry);

        if (targetId && entryId && targetId === entryId) return true;
        if (!targetId && targetType && entryType === targetType && readComparableId(entry) === readComparableId(item)) {
          return true;
        }
      }
    } catch {
      continue;
    }
  }

  return false;
};

const StructuredData = ({ schema }) => {
  const items = Array.isArray(schema) ? schema.filter(Boolean) : schema ? [schema] : [];
  const itemsToRender =
    typeof document === "undefined"
      ? items
      : items.filter((item) => !hasExistingStructuredData(item));

  if (!itemsToRender.length) return null;

  return (
    <>
      {itemsToRender.map((item, index) => (
        <script
          key={item?.["@id"] || item?.url || item?.["@type"] || index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item),
          }}
        />
      ))}
    </>
  );
};

export default StructuredData;
