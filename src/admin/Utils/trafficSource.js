export const captureTrafficSource = () => {
  const params = new URLSearchParams(window.location.search);

  let source = "WEBSITE";

  // 1️⃣ UTM tracking (best for ads)
  if (params.get("utm_source")) {
    const utm = params.get("utm_source").toLowerCase();

    if (utm.includes("facebook") || utm.includes("meta") || utm.includes("instagram"))
      source = "META";

    else if (utm.includes("google"))
      source = "GOOGLE";
  }

  // 2️⃣ Meta ads auto param
  else if (params.get("fbclid")) {
    source = "META";
  }

  // 3️⃣ Google ads auto param
  else if (params.get("gclid")) {
    source = "GOOGLE";
  }

  // 4️⃣ Referrer fallback
  else if (document.referrer) {

    const ref = document.referrer.toLowerCase();

    if (ref.includes("facebook") || ref.includes("instagram"))
      source = "META";

    else if (ref.includes("google"))
      source = "GOOGLE";
  }

  localStorage.setItem("traffic_source", source);
};

export const getTrafficSource = () => {
  return localStorage.getItem("traffic_source") || "WEBSITE";
};