const normalize = (value, max = 120) => {
  const text = String(value || "").trim();
  return text ? text.slice(0, max) : null;
};

const stripIpv6Prefix = (ip = "") => String(ip || "").replace(/^::ffff:/i, "").trim();

const pickFirst = (...values) => {
  for (const value of values) {
    const normalized = normalize(value);
    if (normalized) return normalized;
  }
  return null;
};

const getForwardedIp = (headers = {}) => {
  const forwardedFor = String(headers["x-forwarded-for"] || "")
    .split(",")
    .map((part) => stripIpv6Prefix(part))
    .find(Boolean);

  return (
    forwardedFor ||
    stripIpv6Prefix(headers["x-real-ip"]) ||
    stripIpv6Prefix(headers["cf-connecting-ip"]) ||
    ""
  );
};

const hasLocation = (location = {}) =>
  Boolean(location?.country || location?.state || location?.city);

const fetchLookup = async (url, mapper) => {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return mapper(data);
};

const fetchLocationFromIp = async (ipAddress = "") => {
  const encodedIp = encodeURIComponent(ipAddress);
  const providers = [
    async () =>
      fetchLookup(`https://ipwho.is/${encodedIp}`, (data) => ({
        country: normalize(data?.country),
        state: normalize(data?.region),
        city: normalize(data?.city),
        source: "vercel-ipwhois",
      })),
    async () =>
      fetchLookup(`https://ipapi.co/${encodedIp}/json/`, (data) => ({
        country: normalize(data?.country_name),
        state: normalize(data?.region),
        city: normalize(data?.city),
        source: "vercel-ipapi",
      })),
  ];

  for (const provider of providers) {
    try {
      const result = await provider();
      if (hasLocation(result)) {
        return result;
      }
    } catch {
      // Ignore and try the next provider.
    }
  }

  return null;
};

export default async function handler(req, res) {
  const headers = req.headers || {};
  const forwardedIp = getForwardedIp(headers);

  const headerLocation = {
    country: pickFirst(
      headers["x-vercel-ip-country-name"],
      headers["x-vercel-ip-country"],
      headers["cf-ipcountry"],
      headers["cloudfront-viewer-country-name"]
    ),
    state: pickFirst(
      headers["x-vercel-ip-country-region"],
      headers["x-region-name"],
      headers["x-region"],
      headers["cloudfront-viewer-country-region"]
    ),
    city: pickFirst(
      headers["x-vercel-ip-city"],
      headers["x-city"],
      headers["cloudfront-viewer-city"]
    ),
  };

  let location = headerLocation;
  let source = "vercel-headers";

  if (!hasLocation(location) && forwardedIp) {
    const lookedUp = await fetchLocationFromIp(forwardedIp);
    if (lookedUp) {
      location = {
        country: lookedUp.country,
        state: lookedUp.state,
        city: lookedUp.city,
      };
      source = lookedUp.source;
    }
  }

  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  res.status(200).json({
    ip: forwardedIp || null,
    location,
    source: hasLocation(location) ? source : "unresolved",
  });
}

