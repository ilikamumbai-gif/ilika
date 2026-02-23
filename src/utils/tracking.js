export const captureTrafficSource = () => {
  const params = new URLSearchParams(window.location.search);

  let source = "website";

  // 1️⃣ UTM tracking (best)
  if (params.get("utm_source")) {
    source = params.get("utm_source");
  }

  // 2️⃣ Meta Ads auto detection
  else if (params.get("fbclid")) {
    source = "meta";
  }

  // 3️⃣ Google Ads auto detection
  else if (params.get("gclid")) {
    source = "google";
  }

  // 4️⃣ Referrer fallback
  else if (document.referrer.includes("instagram") || document.referrer.includes("facebook")) {
    source = "meta";
  }
  else if (document.referrer.includes("google")) {
    source = "google";
  }

  localStorage.setItem("traffic_source", source);
};