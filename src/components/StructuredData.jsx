import React from "react";

const StructuredData = ({ schema }) => {
  const items = Array.isArray(schema) ? schema.filter(Boolean) : schema ? [schema] : [];

  if (!items.length) return null;

  return (
    <>
      {items.map((item, index) => (
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
