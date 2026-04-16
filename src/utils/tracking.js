/**
 * Captures the traffic source and stores it in localStorage.
 * Sources: FB | INSTA | FB_ADS | INSTA_ADS | GOOGLE | GOOGLE_ADS | WEBSITE
 */
export const captureTrafficSource = () => {
  const params = new URLSearchParams(window.location.search);
  const ref = document.referrer.toLowerCase();

  let source = "WEBSITE";

  // 1️⃣ UTM source — most reliable, set explicitly by ad campaigns
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
  }

  // 2️⃣ Facebook/Instagram click ID — always paid traffic
  else if (params.get("fbclid")) {
    source = "FB_ADS";
  }

  // 3️⃣ Google Ads click ID — always paid traffic
  else if (params.get("gclid")) {
    source = "GOOGLE_ADS";
  }

  // 4️⃣ Referrer fallback — organic social / organic search
  else if (ref) {
    if (ref.includes("instagram.com")) {
      source = "INSTA";
    } else if (ref.includes("facebook.com") || ref.includes("fb.com")) {
      source = "FB";
    } else if (ref.includes("google.")) {
      source = "GOOGLE";
    }
  }

  localStorage.setItem("traffic_source", source);
};