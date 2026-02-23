export const getTrafficSource = () => {
  // 1️⃣ Check UTM parameters (Ads tracking)
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");

  if (utmSource) {
    if (utmSource.includes("facebook") || utmSource.includes("meta"))
      return "META";
    if (utmSource.includes("google"))
      return "GOOGLE";
  }

  // 2️⃣ Check referrer (Organic social)
  const referrer = document.referrer;

  if (referrer.includes("facebook") || referrer.includes("instagram"))
    return "META";

  if (referrer.includes("google"))
    return "GOOGLE";

  // 3️⃣ Default
  return "WEBSITE";
};