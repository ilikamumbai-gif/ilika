/**
 * Normalizes raw order source values to display labels for admin UI.
 * Maps Firestore values → display labels.
 */
export const normalizeSource = (src) => {
  if (!src) return "WEBSITE";
  const s = src.toUpperCase().trim();

  switch (s) {
    case "FB":         return "Facebook";
    case "FB_ADS":     return "FB Ads";
    case "INSTA":      return "Instagram";
    case "INSTA_ADS":  return "Insta Ads";
    case "GOOGLE":     return "Google";
    case "GOOGLE_ADS": return "Google Ads";
    case "WEBSITE":    return "Website";
    // legacy values
    case "META":
    case "META ADS":   return "FB Ads";
    case "GOOGLE ADS": return "Google Ads";
    default:           return src;
  }
};

export const captureTrafficSource = () => {
  const params = new URLSearchParams(window.location.search);
  const ref = document.referrer.toLowerCase();

  let source = "WEBSITE";

  if (params.get("utm_source")) {
    const utm = params.get("utm_source").toLowerCase();
    const utmMedium = (params.get("utm_medium") || "").toLowerCase();
    const isPaid = utmMedium === "cpc" || utmMedium === "paid" ||
                   utmMedium === "paidsocial" || utmMedium === "ppc";

    if (utm.includes("facebook") || utm === "fb") {
      source = isPaid ? "FB_ADS" : "FB";
    } else if (utm.includes("instagram") || utm === "insta") {
      source = isPaid ? "INSTA_ADS" : "INSTA";
    } else if (utm.includes("google")) {
      source = isPaid ? "GOOGLE_ADS" : "GOOGLE";
    } else {
      source = utm.toUpperCase();
    }
  } else if (params.get("fbclid")) {
    source = "FB_ADS";
  } else if (params.get("gclid")) {
    source = "GOOGLE_ADS";
  } else if (ref) {
    if (ref.includes("instagram.com")) source = "INSTA";
    else if (ref.includes("facebook.com") || ref.includes("fb.com")) source = "FB";
    else if (ref.includes("google.")) source = "GOOGLE";
  }

  localStorage.setItem("traffic_source", source);
};

export const getTrafficSource = () => {
  return localStorage.getItem("traffic_source") || "WEBSITE";
};
