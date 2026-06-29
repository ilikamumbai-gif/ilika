import React, { useEffect, useMemo, useState } from "react";
import {
  Globe,
  MapPinned,
  Map as MapIcon,
  Navigation,
  ShoppingCart,
  Eye,
  MousePointerClick,
  Users,
  CreditCard,
  LogIn,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { getApiUrl } from "../../../utils/api";

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const subtractOneMonth = (date) => {
  const source = new Date(date);
  const target = new Date(source);
  const targetMonth = target.getMonth() - 1;

  target.setDate(1);
  target.setMonth(targetMonth);

  const lastDayOfTargetMonth = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();

  target.setDate(Math.min(source.getDate(), lastDayOfTargetMonth));
  return target;
};

const createDefaultDateRange = () => {
  const today = new Date();
  const from = subtractOneMonth(today);
  return {
    dateFrom: toDateInputValue(from),
    dateTo: toDateInputValue(today),
  };
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDateOnly = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTimeOnly = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const formatLocationLabel = (location = {}) => {
  const city = String(location?.city || "").trim();
  const postalCode = String(location?.postalCode || location?.pincode || "").trim();
  if (city && postalCode) return `${city} - ${postalCode}`;
  if (city) return city;
  if (postalCode) return `PIN ${postalCode}`;
  return [location?.state, location?.country].filter(Boolean).join(", ") || "Unknown";
};

const formatDebugLocation = (location = {}) => {
  const city = String(location?.city || "").trim();
  const postalCode = String(location?.postalCode || "").trim();
  if (city && postalCode) return `${city} - ${postalCode}`;
  if (city) return city;
  if (postalCode) return `PIN ${postalCode}`;
  return [location?.state, location?.country].filter(Boolean).join(", ") || "none";
};

const DEFAULT_LOCATION_LIST_LIMIT = 5;
const BLOCKED_IPS = new Set(["160.25.128.77", "160.25.128.43"]);

const normalizeText = (value) => String(value || "").trim();

const normalizeLabel = (value) => normalizeText(value).toLowerCase();

const COUNTRY_LABEL_ALIASES = {
  in: "India",
  india: "India",
};

const INDIA_STATE_LABEL_ALIASES = {
  an: "Andaman and Nicobar Islands",
  ap: "Andhra Pradesh",
  ar: "Arunachal Pradesh",
  as: "Assam",
  br: "Bihar",
  cg: "Chhattisgarh",
  ch: "Chandigarh",
  dd: "Daman and Diu",
  dl: "Delhi",
  dn: "Dadra and Nagar Haveli",
  ga: "Goa",
  gj: "Gujarat",
  hp: "Himachal Pradesh",
  hr: "Haryana",
  jh: "Jharkhand",
  jk: "Jammu and Kashmir",
  ka: "Karnataka",
  kl: "Kerala",
  la: "Ladakh",
  ld: "Lakshadweep",
  mh: "Maharashtra",
  ml: "Meghalaya",
  mn: "Manipur",
  mp: "Madhya Pradesh",
  mz: "Mizoram",
  nl: "Nagaland",
  or: "Odisha",
  pb: "Punjab",
  py: "Puducherry",
  rj: "Rajasthan",
  sk: "Sikkim",
  tg: "Telangana",
  ts: "Telangana",
  tn: "Tamil Nadu",
  tr: "Tripura",
  uk: "Uttarakhand",
  up: "Uttar Pradesh",
  wb: "West Bengal",
};

const normalizeCountryLabel = (value = "") => {
  const normalized = normalizeLabel(value);
  return COUNTRY_LABEL_ALIASES[normalized] || normalizeText(value);
};

const normalizeStateLabel = (value = "", country = "") => {
  const trimmed = normalizeText(value);
  if (!trimmed) return "";

  if (normalizeCountryLabel(country) !== "India") {
    return trimmed;
  }

  return INDIA_STATE_LABEL_ALIASES[normalizeLabel(trimmed)] || trimmed;
};

const escapeCsvValue = (value) => {
  const normalized = value == null ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
};

const getEventIpCandidates = (event = {}) =>
  [
    event?.clientIp,
    event?.locationDebug?.clientIp,
    event?.locationDebug?.requestIp,
  ]
    .map(normalizeText)
    .filter(Boolean);

const isBlockedIpEvent = (event = {}) =>
  getEventIpCandidates(event).some((ip) => BLOCKED_IPS.has(ip));

const isLocalhostUrl = (pageUrl = "") => {
  const normalized = normalizeText(pageUrl);
  if (!normalized) return false;

  try {
    const parsed = new URL(normalized);
    const hostname = normalizeLabel(parsed.hostname);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
  } catch {
    return /localhost|127\.0\.0\.1|::1/i.test(normalized);
  }
};

const shouldExcludeEvent = (event = {}) =>
  isBlockedIpEvent(event) || isLocalhostUrl(event?.pageUrl);

const getEventLocationParts = (event = {}) => {
  const source = event?.ipLocation || {};
  const country = normalizeCountryLabel(source?.country);

  return {
    city: String(source?.city || "").trim(),
    state: normalizeStateLabel(source?.state, country),
    country,
    postalCode: String(source?.postalCode || source?.pincode || "").trim(),
  };
};

const buildLocationKey = (location = {}) =>
  [
    normalizeText(location?.city) || "Unknown",
    normalizeText(location?.state),
    normalizeText(location?.country),
    normalizeText(location?.postalCode),
  ].join("||");

const buildLocationSummaryRows = (events = [], field) => {
  const groups = new Map();

  events.forEach((event) => {
    const location = getEventLocationParts(event);
    const rawLabel = location[field];
    const label = normalizeText(rawLabel) || "Unknown";
    const locationKey = buildLocationKey(location);

    if (!groups.has(label)) {
      groups.set(label, {
        label,
        visitors: new Set(),
        sessions: new Set(),
        locations: new Set(),
        events: 0,
      });
    }

    const group = groups.get(label);
    group.events += 1;
    if (event?.visitorId) group.visitors.add(event.visitorId);
    if (event?.sessionId) group.sessions.add(event.sessionId);
    group.locations.add(locationKey);
  });

  return Array.from(groups.values())
    .map((group) => ({
      label: group.label,
      visitors: group.visitors.size,
      sessions: group.sessions.size,
      locations: group.locations.size,
      events: group.events,
    }))
    .sort((a, b) => b.visitors - a.visitors || b.events - a.events || a.label.localeCompare(b.label))
    .slice(0, DEFAULT_LOCATION_LIST_LIMIT);
};

const buildActivityByLocationRows = (events = []) => {
  const groups = new Map();

  events.forEach((event) => {
    const location = getEventLocationParts(event);
    const locationLabel = formatLocationLabel(location);
    const locationKey = buildLocationKey(location);

    if (!groups.has(locationKey)) {
      groups.set(locationKey, {
        locationLabel,
        visitors: new Set(),
        eventCount: 0,
        pageViews: 0,
        productViews: 0,
        addToCarts: 0,
        checkouts: 0,
        logins: 0,
      });
    }

    const group = groups.get(locationKey);
    group.eventCount += 1;
    if (event?.visitorId) group.visitors.add(event.visitorId);
    if (event?.eventType === "page_view") group.pageViews += 1;
    if (event?.eventType === "product_view") group.productViews += 1;
    if (event?.eventType === "add_to_cart") group.addToCarts += 1;
    if (event?.eventType === "checkout") group.checkouts += 1;
    if (event?.eventType === "login") group.logins += 1;
  });

  return Array.from(groups.values())
    .map((group) => ({
      locationLabel: group.locationLabel,
      eventCount: group.eventCount,
      visitorCount: group.visitors.size,
      pageViews: group.pageViews,
      productViews: group.productViews,
      addToCarts: group.addToCarts,
      checkouts: group.checkouts,
      logins: group.logins,
    }))
    .sort((a, b) => b.eventCount - a.eventCount || b.visitorCount - a.visitorCount || a.locationLabel.localeCompare(b.locationLabel));
};

const buildCartByLocationRows = (events = []) => {
  const groups = new Map();

  events
    .filter((event) => event?.eventType === "add_to_cart")
    .forEach((event) => {
      const location = getEventLocationParts(event);
      const productId = normalizeText(event?.productId);
      const productName = normalizeText(event?.productName) || "Unknown Product";
      const locationKey = buildLocationKey(location);
      const groupKey = [productId, productName, locationKey].join("||");

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          productId,
          productName,
          city: location.city,
          state: location.state,
          country: location.country,
          postalCode: location.postalCode,
          eventCount: 0,
          totalQuantity: 0,
          totalRevenue: 0,
        });
      }

      const group = groups.get(groupKey);
      const quantity = Number(event?.quantity);
      const price = Number(event?.price);

      group.eventCount += 1;
      group.totalQuantity += Number.isFinite(quantity) ? quantity : 0;
      group.totalRevenue +=
        (Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(price) ? price : 0);
    });

  return Array.from(groups.values()).sort(
    (a, b) => b.eventCount - a.eventCount || b.totalQuantity - a.totalQuantity || a.productName.localeCompare(b.productName)
  );
};

const buildFilterOptionsFromEvents = (events = []) => {
  const countries = new Set();
  const states = new Set();
  const cities = new Set();
  const products = new Set();

  events.forEach((event) => {
    const location = getEventLocationParts(event);
    if (location.country) countries.add(location.country);
    if (location.state) states.add(location.state);
    if (location.city) cities.add(location.city);
    if (event?.productName) products.add(String(event.productName).trim());
  });

  const toSortedArray = (values) => Array.from(values).sort((a, b) => a.localeCompare(b));

  return {
    countries: toSortedArray(countries),
    states: toSortedArray(states),
    cities: toSortedArray(cities),
    products: toSortedArray(products),
  };
};

const buildDerivedSummary = (events = []) => {
  const totalVisitors = new Set(events.map((event) => event?.visitorId).filter(Boolean)).size;
  const totalSessions = new Set(events.map((event) => event?.sessionId).filter(Boolean)).size;
  const eventCounts = events.reduce(
    (accumulator, event) => {
      const eventType = normalizeText(event?.eventType);
      if (eventType && Object.prototype.hasOwnProperty.call(accumulator, eventType)) {
        accumulator[eventType] += 1;
      }
      return accumulator;
    },
    { page_view: 0, product_view: 0, add_to_cart: 0, checkout: 0, login: 0 }
  );

  return {
    totalVisitors,
    totalSessions,
    totalEvents: events.length,
    eventCounts,
    byCountry: buildLocationSummaryRows(events, "country"),
    byState: buildLocationSummaryRows(events, "state"),
    byCity: buildLocationSummaryRows(events, "city"),
    activityByLocation: buildActivityByLocationRows(events),
    cartByLocation: buildCartByLocationRows(events),
  };
};

const buildRecentVisitorRows = (events = []) => events;

const buildLocationAnalyticsCsv = (events = []) => {
  const headers = [
    "Date",
    "Time",
    "Event Type",
    "Visitor ID",
    "Session ID",
    "Product Name",
    "Product ID",
    "Page URL",
    "Country",
    "State",
    "City",
    "Pincode",
    "Quantity",
    "Price",
    "Device",
    "Browser",
    "Client IP",
    "Request IP",
    "Location Source",
  ];

  const rows = events.map((event) => {
    const location = getEventLocationParts(event);
    return [
      formatDateOnly(event.createdAt),
      formatTimeOnly(event.createdAt),
      event?.eventType || "",
      event?.visitorId || "",
      event?.sessionId || "",
      event?.productName || "",
      event?.productId || "",
      event?.pageUrl || "",
      location.country || "",
      location.state || "",
      location.city || "",
      location.postalCode || "",
      event?.quantity ?? "",
      event?.price ?? "",
      event?.device || "",
      event?.browser || "",
      event?.locationDebug?.clientIp || event?.clientIp || "",
      event?.locationDebug?.requestIp || "",
      event?.locationDebug?.locationSource || "",
    ];
  });

  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
};

const triggerCsvDownload = (blob, fileName) => {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
};

const StatCard = ({ title, value, hint, icon, tone = "pink" }) => {
  const Icon = icon;
  const tones = {
    pink: "bg-pink-50 text-pink-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {hint ? <p className="mt-1 text-sm text-gray-500">{hint}</p> : null}
        </div>
        <div className={`grid h-11 w-11 place-content-center rounded-2xl ${tones[tone] || tones.pink}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

const LocationSummaryCard = ({ title, rows, icon }) => {
  const Icon = icon;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-content-center rounded-2xl bg-gray-100 text-gray-700">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">Unique anonymous visitors by location</p>
        </div>
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-xl bg-gray-50 px-3 py-4 text-sm text-gray-400">No data for current filters</p>
        ) : (
          rows.slice(0, 8).map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-800">{row.label}</p>
                <p className="text-xs text-gray-500">{row.events} events</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700">
                {row.visitors} visitors
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const LocationActivityCard = ({ rows = [], loading }) => (
  <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
    <div className="mb-4 flex items-center gap-3">
      <div className="grid h-10 w-10 place-content-center rounded-2xl bg-blue-50 text-blue-600">
        <Globe size={18} />
      </div>
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800">Activity by Location</h2>
        <p className="text-xs text-gray-500">Location-wise event counts for pages, product views, cart activity, checkouts, and logins.</p>
      </div>
    </div>

    <div className="space-y-3">
      {loading ? (
        <p className="rounded-xl bg-gray-50 px-3 py-8 text-center text-sm text-gray-400">Loading location activity...</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-3 py-8 text-center text-sm text-gray-400">No location activity for current filters</p>
      ) : (
        rows.slice(0, 12).map((row) => (
          <div key={row.locationLabel} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-gray-800">{row.locationLabel || "Unknown"}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {row.eventCount} events • {row.visitorCount} visitors
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">
                {row.pageViews} / {row.productViews} / {row.addToCarts} / {row.checkouts} / {row.logins}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-full bg-white px-2.5 py-1">page_view: {row.pageViews}</span>
              <span className="rounded-full bg-white px-2.5 py-1">product_view: {row.productViews}</span>
              <span className="rounded-full bg-white px-2.5 py-1">add_to_cart: {row.addToCarts}</span>
              <span className="rounded-full bg-white px-2.5 py-1">checkout: {row.checkouts}</span>
              <span className="rounded-full bg-white px-2.5 py-1">login: {row.logins}</span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const LocationAnalytics = () => {
  const { getAdminAuthHeaders } = useAdminAuth();
  const [refreshSignal, setRefreshSignal] = useState(() => sessionStorage.getItem("ilika.refresh.at") || "");
  const [filters, setFilters] = useState({
    ...createDefaultDateRange(),
    eventType: "",
    country: "India",
    state: "",
    city: "",
    product: "",
  });
  const [payload, setPayload] = useState({
    events: [],
    summary: {
      totalVisitors: 0,
      totalSessions: 0,
      totalEvents: 0,
      eventCounts: { page_view: 0, product_view: 0, add_to_cart: 0, checkout: 0, login: 0 },
      byCountry: [],
      byState: [],
      byCity: [],
      activityByLocation: [],
      cartByLocation: [],
    },
    filterOptions: {
      countries: [],
      states: [],
      cities: [],
      products: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let timeoutId;

    const scheduleDateRangeRefresh = () => {
      const currentDefaultRange = createDefaultDateRange();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);

      timeoutId = window.setTimeout(() => {
        const nextDefaultRange = createDefaultDateRange();

        setFilters((prev) => {
          const isUsingCurrentDefaultRange =
            prev.dateFrom === currentDefaultRange.dateFrom &&
            prev.dateTo === currentDefaultRange.dateTo;

          if (!isUsingCurrentDefaultRange) {
            return prev;
          }

          return {
            ...prev,
            ...nextDefaultRange,
          };
        });

        scheduleDateRangeRefresh();
      }, nextMidnight.getTime() - Date.now());
    };

    scheduleDateRangeRefresh();

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const visibleEvents = useMemo(
    () => payload.events.filter((event) => !shouldExcludeEvent(event)),
    [payload.events]
  );
  const uniqueVisitorCount = useMemo(
    () =>
      new Set(
        visibleEvents
          .map((event) => normalizeText(event?.visitorId) || normalizeText(event?.sessionId))
          .filter(Boolean)
      ).size,
    [visibleEvents]
  );
  const visibleSummary = useMemo(() => buildDerivedSummary(visibleEvents), [visibleEvents]);
  const visibleFilterOptions = useMemo(() => {
    const fallbackOptions = buildFilterOptionsFromEvents(visibleEvents);

    return {
      countries: payload.filterOptions?.countries?.length ? payload.filterOptions.countries : fallbackOptions.countries,
      states: payload.filterOptions?.states?.length ? payload.filterOptions.states : fallbackOptions.states,
      cities: payload.filterOptions?.cities?.length ? payload.filterOptions.cities : fallbackOptions.cities,
      products: payload.filterOptions?.products?.length ? payload.filterOptions.products : fallbackOptions.products,
    };
  }, [payload.filterOptions, visibleEvents]);

  const downloadFilteredCsv = async () => {
    if (loading || exportingCsv) return;

    try {
      setExportingCsv(true);
      setError("");

      const fallbackFileName = `location-analytics-${new Date().toISOString().slice(0, 10)}.csv`;

      const res = await fetch(getApiUrl("/api/visitor-analytics/export.csv"), {
        headers: {
          ...getAdminAuthHeaders(),
        },
      });
      if (!res.ok) {
        const errorPayload = await res.json().catch(() => ({}));
        throw new Error(errorPayload?.error || "Failed to download location analytics CSV");
      }

      const blob = await res.blob();
      if (!blob.size) {
        throw new Error("No analytics records found");
      }

      const disposition = res.headers.get("content-disposition") || "";
      const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);
      const fileName = fileNameMatch?.[1] || fallbackFileName;

      triggerCsvDownload(blob, fileName);
    } catch (downloadError) {
      console.error("Location analytics CSV download error:", downloadError);
      setError(downloadError.message || "Failed to download location analytics CSV");
    } finally {
      setExportingCsv(false);
    }
  };

  useEffect(() => {
    const syncRefreshSignal = (nextValue) => {
      const latestValue =
        typeof nextValue === "string" && nextValue.trim()
          ? nextValue
          : sessionStorage.getItem("ilika.refresh.at") || "";

      setRefreshSignal((currentValue) => (currentValue === latestValue ? currentValue : latestValue));
    };

    const handleAdminRefresh = (event) => {
      syncRefreshSignal(event?.detail?.at);
    };

    const handleFocusRefresh = () => {
      syncRefreshSignal();
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "visible") {
        syncRefreshSignal();
      }
    };

    window.addEventListener("ilika:admin-refresh", handleAdminRefresh);
    window.addEventListener("focus", handleFocusRefresh);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      window.removeEventListener("ilika:admin-refresh", handleAdminRefresh);
      window.removeEventListener("focus", handleFocusRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (String(value || "").trim()) {
            params.set(key, value);
          }
        });

        const res = await fetch(getApiUrl(`/api/visitor-analytics?${params.toString()}`), {
          headers: {
            "Content-Type": "application/json",
            ...getAdminAuthHeaders(),
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load location analytics");
        }

        setPayload((current) => ({
          events: Array.isArray(data?.events) ? data.events : [],
          summary: data?.summary || current.summary,
          filterOptions: data?.filterOptions || current.filterOptions,
        }));
      } catch (loadError) {
        console.error("Location analytics load error:", loadError);
        setError(loadError.message || "Failed to load location analytics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filters, getAdminAuthHeaders, refreshSignal]);

  const recentVisitors = useMemo(() => buildRecentVisitorRows(visibleEvents), [visibleEvents]);
  const countrySummaryRows = useMemo(
    () => {
      if (!filters.country) return visibleSummary.byCountry;
      return visibleSummary.byCountry.filter(
        (row) =>
          normalizeLabel(normalizeCountryLabel(row.label)) ===
          normalizeLabel(normalizeCountryLabel(filters.country))
      );
    },
    [filters.country, visibleSummary.byCountry]
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Location Analytics</h1>
        <p className="mt-0.5 text-sm text-gray-400">
          Anonymous visitor activity by page, product, cart action, checkout, login, and approximate IP-based location.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800">Filters</h2>
            <p className="text-xs text-gray-500">Refine visitor events by date, location, event type, or product.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={downloadFilteredCsv}
              disabled={loading || exportingCsv}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
            >
              {exportingCsv ? "Downloading CSV..." : "Download CSV"}
            </button>
            <button
              type="button"
              onClick={() =>
                setFilters({
                  ...createDefaultDateRange(),
                  eventType: "",
                  country: "India",
                  state: "",
                  city: "",
                  product: "",
                })
              }
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Reset filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Date from</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-pink-400"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Date to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-pink-400"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Event type</span>
            <select
              value={filters.eventType}
              onChange={(e) => setFilters((prev) => ({ ...prev, eventType: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-pink-400"
            >
              <option value="">All events</option>
              <option value="page_view">page_view</option>
              <option value="product_view">product_view</option>
              <option value="add_to_cart">add_to_cart</option>
              <option value="checkout">checkout</option>
              <option value="login">login</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Country</span>
            <select
              value={filters.country}
              onChange={(e) => setFilters((prev) => ({ ...prev, country: e.target.value, state: "", city: "" }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-pink-400"
            >
              <option value="">All countries</option>
              {visibleFilterOptions.countries.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">State</span>
            <select
              value={filters.state}
              onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value, city: "" }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-pink-400"
            >
              <option value="">All states</option>
              {visibleFilterOptions.states.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">City</span>
            <select
              value={filters.city}
              onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-pink-400"
            >
              <option value="">All cities</option>
              {visibleFilterOptions.cities.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2 xl:col-span-1">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Product</span>
            <select
              value={filters.product}
              onChange={(e) => setFilters((prev) => ({ ...prev, product: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-pink-400"
            >
              <option value="">All products</option>
              {visibleFilterOptions.products.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          title="Total visitors"
          value={loading ? "..." : visibleSummary.totalVisitors.toLocaleString("en-IN")}
          hint={`${visibleSummary.totalSessions.toLocaleString("en-IN")} sessions`}
          icon={Users}
          tone="pink"
        />
        <StatCard
          title="Page views"
          value={loading ? "..." : visibleSummary.eventCounts.page_view.toLocaleString("en-IN")}
          hint="Anonymous page visit events"
          icon={Globe}
          tone="blue"
        />
        <StatCard
          title="Product views"
          value={loading ? "..." : visibleSummary.eventCounts.product_view.toLocaleString("en-IN")}
          hint="Product detail opens"
          icon={Eye}
          tone="amber"
        />
        <StatCard
          title="Add to cart"
          value={loading ? "..." : visibleSummary.eventCounts.add_to_cart.toLocaleString("en-IN")}
          hint="Cart actions by anonymous visitors"
          icon={ShoppingCart}
          tone="emerald"
        />
        <StatCard
          title="Checkouts"
          value={loading ? "..." : visibleSummary.eventCounts.checkout.toLocaleString("en-IN")}
          hint="Checkout page visits"
          icon={CreditCard}
          tone="amber"
        />
        <StatCard
          title="Logins"
          value={loading ? "..." : visibleSummary.eventCounts.login.toLocaleString("en-IN")}
          hint="Successful login events"
          icon={LogIn}
          tone="blue"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <LocationSummaryCard title="Visitors by Country" rows={countrySummaryRows} icon={MapPinned} />
        <LocationSummaryCard title="Visitors by State" rows={visibleSummary.byState} icon={MapIcon} />
        <LocationSummaryCard title="Visitors by City" rows={visibleSummary.byCity} icon={Navigation} />
      </div>

      <div className="mb-6 grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <LocationActivityCard rows={visibleSummary.activityByLocation} loading={loading} />

        <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-content-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MousePointerClick size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800">Add to Cart Activity by Location</h2>
              <p className="text-xs text-gray-500">Product-wise cart activity grouped by location.</p>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="rounded-xl bg-gray-50 px-3 py-8 text-center text-sm text-gray-400">Loading cart location activity...</p>
            ) : visibleSummary.cartByLocation.length === 0 ? (
              <p className="rounded-xl bg-gray-50 px-3 py-8 text-center text-sm text-gray-400">No add-to-cart events for current filters</p>
            ) : (
              visibleSummary.cartByLocation.slice(0, 12).map((row, index) => (
                <div key={`${row.productId || row.productName}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-gray-800">{row.productName || "Unknown Product"}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatLocationLabel({
                          city: row.city,
                          state: row.state,
                          country: row.country,
                          postalCode: row.postalCode,
                        })}
                      </p>
                      {row.productId ? <p className="mt-1 break-all text-[11px] text-gray-400">{row.productId}</p> : null}
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700">
                      {row.totalQuantity} qty
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span className="rounded-full bg-white px-2.5 py-1">{row.eventCount} cart events</span>
                    <span className="rounded-full bg-white px-2.5 py-1">{formatCurrency(row.totalRevenue)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800">Recent Visitors</h2>
              <p className="text-xs text-gray-500">Latest filtered activity per anonymous visitor across pages, product views, and carts.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600">
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {uniqueVisitorCount.toLocaleString("en-IN")} visitors
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {visibleEvents.length.toLocaleString("en-IN")} events
              </span>
            </div>
          </div>

          <div className="space-y-3 lg:hidden">
            {loading ? (
              <p className="rounded-xl bg-gray-50 px-3 py-8 text-center text-sm text-gray-400">Loading visitor analytics...</p>
            ) : recentVisitors.length === 0 ? (
              <p className="rounded-xl bg-gray-50 px-3 py-8 text-center text-sm text-gray-400">No recent visitors found for current filters</p>
            ) : (
              recentVisitors.map((event, index) => (
                <div key={event.id || `${event.visitorId || event.sessionId || "visitor"}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{formatDateTime(event.createdAt)}</p>
                      <p className="mt-1 break-all text-xs text-gray-500">{event.visitorId || "â€”"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-700">
                      {event.eventType}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Session</p>
                      <p className="mt-1 break-all text-xs text-gray-600">{event.sessionId || "â€”"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Location</p>
                      <p className="mt-1">{formatLocationLabel(event.ipLocation)}</p>
                      <p className="mt-1 break-all text-[11px] text-gray-500">
                        source: {event.locationDebug?.locationSource || "unknown"}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Page</p>
                      <p className="mt-1 break-all text-xs text-gray-600">{event.pageUrl || "â€”"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Product</p>
                      <p className="mt-1 font-medium text-gray-800">{event.productName || "â€”"}</p>
                      {event.productId ? <p className="mt-1 break-all text-xs text-gray-500">{event.productId}</p> : null}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Details</p>
                      <p className="mt-1 text-xs text-gray-600">
                        Qty: {event.quantity ?? "â€”"} | Price: {event.price != null ? formatCurrency(event.price) : "â€”"}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {[event.device, event.browser].filter(Boolean).join(" Â· ") || "â€”"}
                      </p>
                      <p className="mt-1 break-all text-[11px] text-gray-500">
                        clientIp: {event.locationDebug?.clientIp || "none"} | requestIp: {event.locationDebug?.requestIp || "none"}
                      </p>
                      <p className="mt-1 break-all text-[11px] text-gray-500">
                        header: {formatDebugLocation(event.locationDebug?.headerLocation)} | client: {formatDebugLocation(event.locationDebug?.clientIpLocation)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-[1180px] w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-[0.12em] text-gray-500">
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">Latest Event</th>
                  <th className="px-3 py-3">Visitor / Session</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-3 py-3">Page</th>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Qty</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">Device</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-3 py-10 text-center text-sm text-gray-400">Loading visitor analytics...</td>
                  </tr>
                ) : recentVisitors.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-3 py-10 text-center text-sm text-gray-400">No recent visitors found for current filters</td>
                  </tr>
                ) : (
                  recentVisitors.map((event, index) => (
                    <tr key={event.id || `${event.visitorId || event.sessionId || "visitor"}-${index}`} className="border-b border-gray-100 align-top">
                      <td className="px-3 py-3 text-gray-700">{formatDateTime(event.createdAt)}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-700">
                          {event.eventType}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">
                        <div className="font-semibold text-gray-800">{event.visitorId || "—"}</div>
                        <div className="mt-1">{event.sessionId || "—"}</div>
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        <div>{formatLocationLabel(event.ipLocation)}</div>
                        <div className="mt-1 text-[11px] text-gray-500">
                          source: {event.locationDebug?.locationSource || "unknown"}
                        </div>
                        <div className="mt-1 break-all text-[11px] text-gray-400">
                          clientIp: {event.locationDebug?.clientIp || "none"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 break-all">{event.pageUrl || "—"}</td>
                      <td className="px-3 py-3 text-gray-700">
                        <div className="font-semibold text-gray-800">{event.productName || "—"}</div>
                        <div className="mt-1 text-xs text-gray-500">{event.productId || ""}</div>
                      </td>
                      <td className="px-3 py-3 text-gray-700">{event.quantity ?? "—"}</td>
                      <td className="px-3 py-3 text-gray-700">{event.price != null ? formatCurrency(event.price) : "—"}</td>
                      <td className="px-3 py-3 text-gray-700">
                        <div>{[event.device, event.browser].filter(Boolean).join(" · ") || "—"}</div>
                        <div className="mt-1 break-all text-[11px] text-gray-400">
                          header: {formatDebugLocation(event.locationDebug?.headerLocation)}
                        </div>
                        <div className="mt-1 break-all text-[11px] text-gray-400">
                          client: {formatDebugLocation(event.locationDebug?.clientIpLocation)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LocationAnalytics;
