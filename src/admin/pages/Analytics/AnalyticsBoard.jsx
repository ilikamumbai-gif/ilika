import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { useAdminAuth } from "../../context/AdminAuthContext";

const CARD_TITLES = [
  { key: "fullTraffic", label: "Full Traffic Chart" },
  { key: "metaClick", label: "Meta Click Chart" },
  { key: "googleClick", label: "Google Click Chart" },
  { key: "organicSearch", label: "Organic Search Chart" },
];

const REVENUE_TITLES = [
  { key: "meta", label: "Revenue from Meta" },
  { key: "google", label: "Revenue from Google" },
  { key: "organic", label: "Revenue from Organic" },
];

const FALLBACK_ANALYTICS = {
  fullTraffic: [
    { label: "May 20", value: 24 },
    { label: "May 21", value: 28 },
    { label: "May 22", value: 42 },
    { label: "May 23", value: 35 },
    { label: "May 24", value: 57 },
    { label: "May 25", value: 49 },
  ],
  metaClick: [
    { label: "May 20", value: 10 },
    { label: "May 21", value: 14 },
    { label: "May 22", value: 19 },
    { label: "May 23", value: 13 },
    { label: "May 24", value: 22 },
    { label: "May 25", value: 18 },
  ],
  googleClick: [
    { label: "May 20", value: 6 },
    { label: "May 21", value: 8 },
    { label: "May 22", value: 12 },
    { label: "May 23", value: 11 },
    { label: "May 24", value: 14 },
    { label: "May 25", value: 13 },
  ],
  organicSearch: [
    { label: "May 20", value: 8 },
    { label: "May 21", value: 7 },
    { label: "May 22", value: 11 },
    { label: "May 23", value: 10 },
    { label: "May 24", value: 16 },
    { label: "May 25", value: 15 },
  ],
  revenue: { meta: 24500, google: 18200, organic: 15300 },
};

const normalizeSeries = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (typeof item === "number") return { label: `P${index + 1}`, value: item };
      if (item && typeof item === "object") {
        const pointValue = Number(item.value ?? item.count ?? item.sessions ?? item.clicks ?? 0);
        const label = String(item.label ?? item.date ?? item.day ?? `P${index + 1}`);
        return { label, value: Number.isFinite(pointValue) ? pointValue : 0 };
      }
      return { label: `P${index + 1}`, value: 0 };
    })
    .filter((item) => Number.isFinite(item.value));
};

const deriveAnalyticsFromOrders = (orders = []) => {
  const days = 30;
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const fmt = (d) =>
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  const toDate = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === "function") return value.toDate();
    if (value?._seconds) return new Date(value._seconds * 1000);
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const normalizeSource = (raw = "") => {
    const src = String(raw || "").toLowerCase();
    if (src.includes("facebook") || src.includes("fb") || src.includes("insta") || src.includes("meta")) return "meta";
    if (src.includes("google")) return "google";
    return "organic";
  };

  const labels = [];
  const fullTrafficMap = new Map();
  const metaClickMap = new Map();
  const googleClickMap = new Map();
  const organicSearchMap = new Map();

  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = fmt(d);
    labels.push(key);
    fullTrafficMap.set(key, 0);
    metaClickMap.set(key, 0);
    googleClickMap.set(key, 0);
    organicSearchMap.set(key, 0);
  }

  let metaRevenue = 0;
  let googleRevenue = 0;
  let organicRevenue = 0;

  orders.forEach((order) => {
    const createdAt = toDate(order.createdAt);
    if (!createdAt) return;
    if (createdAt < start) return;
    const key = fmt(createdAt);
    if (!fullTrafficMap.has(key)) return;

    const source = normalizeSource(order.source);
    const amount = Number(order.totalAmount || order.total || 0);
    fullTrafficMap.set(key, Number(fullTrafficMap.get(key) || 0) + 1);
    if (source === "meta") {
      metaClickMap.set(key, Number(metaClickMap.get(key) || 0) + 1);
      metaRevenue += amount;
    } else if (source === "google") {
      googleClickMap.set(key, Number(googleClickMap.get(key) || 0) + 1);
      googleRevenue += amount;
    } else {
      organicSearchMap.set(key, Number(organicSearchMap.get(key) || 0) + 1);
      organicRevenue += amount;
    }
  });

  const toSeries = (map) => labels.map((label) => ({ label, value: Number(map.get(label) || 0) }));
  return {
    fullTraffic: toSeries(fullTrafficMap),
    metaClick: toSeries(metaClickMap),
    googleClick: toSeries(googleClickMap),
    organicSearch: toSeries(organicSearchMap),
    revenue: {
      meta: Number(metaRevenue.toFixed(2)),
      google: Number(googleRevenue.toFixed(2)),
      organic: Number(organicRevenue.toFixed(2)),
    },
  };
};

const toCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const toNumber = (value) => Number(value || 0).toLocaleString("en-IN");

const SimpleLineChart = ({ data = [] }) => {
  const width = 560;
  const height = 220;
  const points = useMemo(() => {
    if (!data.length) return "";
    const max = Math.max(...data.map((d) => d.value), 1);
    return data
      .map((d, i) => {
        const x = (i / Math.max(data.length - 1, 1)) * (width - 20) + 10;
        const y = height - ((d.value / max) * (height - 30) + 15);
        return `${x},${y}`;
      })
      .join(" ");
  }, [data]);

  if (!data.length) {
    return <div className="h-[220px] grid place-items-center text-sm text-gray-400">No chart data</div>;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[220px]">
      <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      <polyline
        points={`${points} ${width - 10},${height - 5} 10,${height - 5}`}
        fill="rgba(37,99,235,0.12)"
        stroke="none"
      />
    </svg>
  );
};

const ChartCard = ({ title, data }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <span className="text-xs text-gray-500">{toNumber(data.reduce((sum, item) => sum + Number(item.value || 0), 0))}</span>
    </div>
    <SimpleLineChart data={data} />
  </div>
);

const AnalyticsBoard = () => {
  const { getAdminAuthHeaders } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [analytics, setAnalytics] = useState({
    fullTraffic: [],
    metaClick: [],
    googleClick: [],
    organicSearch: [],
    revenue: { meta: 0, google: 0, organic: 0 },
  });

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL;
    const analyticsPath = import.meta.env.VITE_ADMIN_ANALYTICS_ENDPOINT;
    const headers = {
      "Content-Type": "application/json",
      ...getAdminAuthHeaders(),
    };

    const load = async () => {
      setLoading(true);
      setError("");
      setInfo("");

      if (!analyticsPath) {
        setAnalytics(FALLBACK_ANALYTICS);
        setInfo("Showing sample analytics. Set VITE_ADMIN_ANALYTICS_ENDPOINT to your backend route.");
        setLoading(false);
        return;
      }

      try {
        const endpoint = analyticsPath.startsWith("http") ? analyticsPath : `${API}${analyticsPath}`;
        const res = await fetch(endpoint, { headers });
        if (!res.ok) {
          // Fallback: derive analytics from orders if analytics route is not deployed yet.
          const ordersRes = await fetch(`${API}/api/orders`, { headers });
          if (ordersRes.ok) {
            const orders = await ordersRes.json();
            setAnalytics(deriveAnalyticsFromOrders(Array.isArray(orders) ? orders : []));
            setError("Analytics route not found on backend. Showing computed analytics from orders.");
            setLoading(false);
            return;
          }
          setAnalytics(FALLBACK_ANALYTICS);
          setError("Analytics endpoint not found. Showing sample analytics data.");
          setLoading(false);
          return;
        }

        const payload = await res.json();
        const source = payload.data || payload;
        const fullTraffic = normalizeSeries(source.fullTraffic || source.sessionsOverTime || source.traffic);
        const metaClick = normalizeSeries(source.metaClick || source.metaClicks || source.facebookClicks);
        const googleClick = normalizeSeries(source.googleClick || source.googleClicks);
        const organicSearch = normalizeSeries(source.organicSearch || source.organic || source.organicTraffic);

        const revenue = source.revenue || {};
        setAnalytics({
          fullTraffic,
          metaClick,
          googleClick,
          organicSearch,
          revenue: {
            meta: Number(revenue.meta || revenue.facebook || 0),
            google: Number(revenue.google || 0),
            organic: Number(revenue.organic || 0),
          },
        });
      } catch (fetchError) {
        setAnalytics(FALLBACK_ANALYTICS);
        setError("Unable to fetch analytics data from backend. Showing sample analytics data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [getAdminAuthHeaders]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Marketing Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Traffic, channel clicks, and revenue overview</p>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-sm text-gray-500">Loading analytics...</div>
      ) : error ? (
        <div className="space-y-4">
          <div className="bg-white border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {REVENUE_TITLES.map((item) => (
              <div key={item.key} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{toCurrency(analytics.revenue[item.key])}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {CARD_TITLES.map((card) => (
              <ChartCard key={card.key} title={card.label} data={analytics[card.key]} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {info ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">{info}</div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {REVENUE_TITLES.map((item) => (
              <div key={item.key} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{toCurrency(analytics.revenue[item.key])}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {CARD_TITLES.map((card) => (
              <ChartCard key={card.key} title={card.label} data={analytics[card.key]} />
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AnalyticsBoard;
