export const getImageUrl = (url, updatedAt) => {
  if (!url) return "";
  return `${url}?v=${updatedAt || 1}`;
};