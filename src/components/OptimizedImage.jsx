import React from "react";

const OptimizedImage = ({
  src,
  alt,
  className = "",
  width,
  height,
  sizes,
  priority = false,
  decoding = "async",
  loading,
  fetchPriority,
  ...rest
}) => {
  const resolvedLoading = loading || (priority ? "eager" : "lazy");
  const resolvedFetchPriority = fetchPriority || (priority ? "high" : "auto");

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      sizes={sizes}
      loading={resolvedLoading}
      fetchPriority={resolvedFetchPriority}
      decoding={decoding}
      {...rest}
    />
  );
};

export default OptimizedImage;
