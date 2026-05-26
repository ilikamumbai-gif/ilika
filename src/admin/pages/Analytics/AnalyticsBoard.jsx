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
  firebaseAnalytics: {
    usersTotal: 0,
    ordersTotal: 0,
    cartEventsTotal: 0,
    ordersInRange: 0,
    cartEventsInRange: 0,
  },
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

const deriveAnalyticsFromOrders = (orders = [], days = 30, extras = {}) => {
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
    firebaseAnalytics: {
      usersTotal: Number(extras.usersTotal || 0),
      ordersTotal: Array.isArray(orders) ? orders.length : 0,
      cartEventsTotal: Number(extras.cartEventsTotal || 0),
      ordersInRange: Array.isArray(orders) ? orders.length : 0,
      cartEventsInRange: Number(extras.cartEventsInRange || 0),
    },
  };
};

const toCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const toNumber = (value) => Number(value || 0).toLocaleString("en-IN");

const SimpleLineChart = ({ data = [] }) => {
  const width = 560;
  const height = 240;
  const leftPad = 38;
  const rightPad = 12;
  const topPad = 12;
  const bottomPad = 30;
  const points = useMemo(() => {
    if (!data.length) return "";
    const max = Math.max(...data.map((d) => d.value), 1);
    return data
      .map((d, i) => {
        const x =
          (i / Math.max(data.length - 1, 1)) * (width - leftPad - rightPad) + leftPad;
        const y =
          height - bottomPad - (d.value / max) * (height - topPad - bottomPad);
        return `${x},${y}`;
      })
      .join(" ");
  }, [data]);

  const maxY = Math.max(...data.map((d) => Number(d.value || 0)), 1);
  const midY = Math.round(maxY / 2);
  const firstLabel = data[0]?.label || "";
  const midLabel = data[Math.floor(data.length / 2)]?.label || "";
  const lastLabel = data[data.length - 1]?.label || "";

  if (!data.length) {
    return <div className="h-[220px] grid place-items-center text-sm text-gray-400">No chart data</div>;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[240px]">
      <line x1={leftPad} y1={topPad} x2={leftPad} y2={height - bottomPad} stroke="#cbd5e1" strokeWidth="1" />
      <line x1={leftPad} y1={height - bottomPad} x2={width - rightPad} y2={height - bottomPad} stroke="#cbd5e1" strokeWidth="1" />
      <line x1={leftPad} y1={height - bottomPad - (height - topPad - bottomPad) / 2} x2={width - rightPad} y2={height - bottomPad - (height - topPad - bottomPad) / 2} stroke="#e5e7eb" strokeWidth="1" />

      <text x={leftPad - 6} y={height - bottomPad + 4} textAnchor="end" fontSize="10" fill="#64748b">0</text>
      <text x={leftPad - 6} y={height - bottomPad - (height - topPad - bottomPad) / 2 + 4} textAnchor="end" fontSize="10" fill="#64748b">{midY}</text>
      <text x={leftPad - 6} y={topPad + 4} textAnchor="end" fontSize="10" fill="#64748b">{maxY}</text>

      <text x={leftPad} y={height - 8} textAnchor="start" fontSize="10" fill="#64748b">{firstLabel}</text>
      <text x={(width - leftPad - rightPad) / 2 + leftPad} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b">{midLabel}</text>
      <text x={width - rightPad} y={height - 8} textAnchor="end" fontSize="10" fill="#64748b">{lastLabel}</text>

      <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      <polyline
        points={`${points} ${width - rightPad},${height - bottomPad} ${leftPad},${height - bottomPad}`}
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
  const [days, setDays] = useState(30);
  const [live, setLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [analytics, setAnalytics] = useState({
    fullTraffic: [],
    metaClick: [],
    googleClick: [],
    organicSearch: [],
    revenue: { meta: 0, google: 0, organic: 0 },
    firebaseAnalytics: {
      usersTotal: 0,
      ordersTotal: 0,
      cartEventsTotal: 0,
      ordersInRange: 0,
      cartEventsInRange: 0,
    },
    metaAds: {
      enabled: false,
      rows: [],
      totalImpressions: 0,
      totalClicks: 0,
      totalSpend: 0,
      error: null,
    },
    googleAds: {
      enabled: false,
      rows: [],
      channelTotals: [],
      totalImpressions: 0,
      totalClicks: 0,
      totalSpend: 0,
      error: null,
    },
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
        const baseEndpoint = analyticsPath.startsWith("http") ? analyticsPath : `${API}${analyticsPath}`;
        const joiner = baseEndpoint.includes("?") ? "&" : "?";
        const endpoint = `${baseEndpoint}${joiner}days=${days}`;
        const res = await fetch(endpoint, { headers });
        if (!res.ok) {
          // Fallback: derive analytics from orders if analytics route is not deployed yet.
          const ordersRes = await fetch(`${API}/api/orders`, { headers });
          if (ordersRes.ok) {
            const orders = await ordersRes.json();
            const [usersRes, cartEventsRes] = await Promise.all([
              fetch(`${API}/api/users`, { headers }).catch(() => null),
              fetch(`${API}/api/cart-events`, { headers }).catch(() => null),
            ]);

            const users = usersRes?.ok ? await usersRes.json() : [];
            const cartEvents = cartEventsRes?.ok ? await cartEventsRes.json() : [];
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - (days - 1));
            daysAgo.setHours(0, 0, 0, 0);

            const toDate = (value) => {
              if (!value) return null;
              if (typeof value?.toDate === "function") return value.toDate();
              if (value?._seconds) return new Date(value._seconds * 1000);
              const d = new Date(value);
              return Number.isNaN(d.getTime()) ? null : d;
            };

            const cartEventsInRange = Array.isArray(cartEvents)
              ? cartEvents.filter((item) => {
                  const created = toDate(item?.createdAt);
                  return created && created >= daysAgo;
                }).length
              : 0;

            setAnalytics(
              deriveAnalyticsFromOrders(
                Array.isArray(orders) ? orders : [],
                days,
                {
                  usersTotal: Array.isArray(users) ? users.length : 0,
                  cartEventsTotal: Array.isArray(cartEvents) ? cartEvents.length : 0,
                  cartEventsInRange,
                }
              )
            );
            setError("Analytics route not found on backend. Showing computed analytics from orders.");
            setLastUpdated(new Date());
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
          firebaseAnalytics: {
            usersTotal: Number(source?.firebaseAnalytics?.usersTotal || 0),
            ordersTotal: Number(source?.firebaseAnalytics?.ordersTotal || 0),
            cartEventsTotal: Number(source?.firebaseAnalytics?.cartEventsTotal || 0),
            ordersInRange: Number(source?.firebaseAnalytics?.ordersInRange || 0),
            cartEventsInRange: Number(source?.firebaseAnalytics?.cartEventsInRange || 0),
          },
          metaAds: {
            enabled: Boolean(source?.metaAds?.enabled),
            rows: Array.isArray(source?.metaAds?.rows) ? source.metaAds.rows : [],
            platformTotals: Array.isArray(source?.metaAds?.platformTotals) ? source.metaAds.platformTotals : [],
            totalImpressions: Number(source?.metaAds?.totalImpressions || 0),
            totalClicks: Number(source?.metaAds?.totalClicks || 0),
            totalSpend: Number(source?.metaAds?.totalSpend || 0),
            error: source?.metaAds?.error || null,
          },
          googleAds: {
            enabled: Boolean(source?.googleAds?.enabled),
            rows: Array.isArray(source?.googleAds?.rows) ? source.googleAds.rows : [],
            channelTotals: Array.isArray(source?.googleAds?.channelTotals) ? source.googleAds.channelTotals : [],
            totalImpressions: Number(source?.googleAds?.totalImpressions || 0),
            totalClicks: Number(source?.googleAds?.totalClicks || 0),
            totalSpend: Number(source?.googleAds?.totalSpend || 0),
            error: source?.googleAds?.error || null,
          },
        });
        setLastUpdated(new Date());
      } catch (fetchError) {
        setAnalytics(FALLBACK_ANALYTICS);
        setError("Unable to fetch analytics data from backend. Showing sample analytics data.");
        setLastUpdated(new Date());
      } finally {
        setLoading(false);
      }
    };

    load();
    let timer = null;
    if (live) {
      timer = window.setInterval(() => {
        load();
      }, 30000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [getAdminAuthHeaders, days, live]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Marketing Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Traffic, channel clicks, and revenue overview</p>
            {lastUpdated ? (
              <p className="text-xs text-gray-400 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString("en-IN")}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <label className="flex items-center gap-2 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <input
                type="checkbox"
                checked={live}
                onChange={(e) => setLive(e.target.checked)}
              />
              Live
            </label>
          </div>
        </div>
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

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Firebase Analytics Snapshot</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[11px] text-gray-500">Users (Total)</p>
                <p className="text-lg font-bold text-gray-900">{toNumber(analytics.firebaseAnalytics.usersTotal)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[11px] text-gray-500">Orders (Total)</p>
                <p className="text-lg font-bold text-gray-900">{toNumber(analytics.firebaseAnalytics.ordersTotal)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[11px] text-gray-500">Cart Events (Total)</p>
                <p className="text-lg font-bold text-gray-900">{toNumber(analytics.firebaseAnalytics.cartEventsTotal)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[11px] text-gray-500">Orders ({days}d)</p>
                <p className="text-lg font-bold text-gray-900">{toNumber(analytics.firebaseAnalytics.ordersInRange)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[11px] text-gray-500">Cart Events ({days}d)</p>
                <p className="text-lg font-bold text-gray-900">{toNumber(analytics.firebaseAnalytics.cartEventsInRange)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Meta Ads Insights (Facebook Ads + Instagram Ads + Audience Network Ads)</h3>
            {analytics.metaAds.error ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                {analytics.metaAds.error}
              </p>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[11px] text-gray-500">Impressions</p>
                <p className="text-lg font-bold text-gray-900">{toNumber(analytics.metaAds.totalImpressions)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[11px] text-gray-500">Clicks</p>
                <p className="text-lg font-bold text-gray-900">{toNumber(analytics.metaAds.totalClicks)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[11px] text-gray-500">Spend (INR)</p>
                <p className="text-lg font-bold text-gray-900">{toCurrency(analytics.metaAds.totalSpend)}</p>
              </div>
            </div>
            {analytics.metaAds.platformTotals?.length ? (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-xs text-gray-500">Platform</th>
                      <th className="text-right py-2 text-xs text-gray-500">Impressions</th>
                      <th className="text-right py-2 text-xs text-gray-500">Clicks</th>
                      <th className="text-right py-2 text-xs text-gray-500">Spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.metaAds.platformTotals.map((item, idx) => (
                      <tr key={`${item.platform}_${idx}`} className="border-b border-gray-100">
                        <td className="py-2 capitalize">{item.platform === "audience_network" ? "Audience Network Ads" : `${item.platform.replace("_", " ")} Ads`}</td>
                        <td className="py-2 text-right">{toNumber(item.impressions)}</td>
                        <td className="py-2 text-right">{toNumber(item.clicks)}</td>
                        <td className="py-2 text-right">{toCurrency(item.spend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-xs text-gray-500">Date</th>
                    <th className="text-left py-2 text-xs text-gray-500">Platform</th>
                    <th className="text-left py-2 text-xs text-gray-500">Campaign</th>
                    <th className="text-left py-2 text-xs text-gray-500">Ad Set</th>
                    <th className="text-left py-2 text-xs text-gray-500">Ad</th>
                    <th className="text-right py-2 text-xs text-gray-500">Impressions</th>
                    <th className="text-right py-2 text-xs text-gray-500">Clicks</th>
                    <th className="text-right py-2 text-xs text-gray-500">Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics.metaAds.rows || []).slice(0, 40).map((row, idx) => (
                    <tr key={`${row.date}_${row.campaignName}_${idx}`} className="border-b border-gray-100">
                      <td className="py-2">{row.date || "-"}</td>
                      <td className="py-2 capitalize">{row.publisherPlatform === "audience_network" ? "Audience Network Ads" : `${String(row.publisherPlatform || "-").replace("_", " ")} Ads`}</td>
                      <td className="py-2">{row.campaignName || "-"}</td>
                      <td className="py-2">{row.adsetName || "-"}</td>
                      <td className="py-2">{row.adName || "-"}</td>
                      <td className="py-2 text-right">{toNumber(row.impressions)}</td>
                      <td className="py-2 text-right">{toNumber(row.clicks)}</td>
                      <td className="py-2 text-right">{toCurrency(row.spend)}</td>
                    </tr>
                  ))}
                  {!analytics.metaAds.rows?.length ? (
                    <tr>
                      <td className="py-3 text-gray-400 text-sm" colSpan={8}>No Meta ads data available for this date range.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Google Ads Insights</h3>
            {analytics.googleAds.error ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                {analytics.googleAds.error}
              </p>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[11px] text-gray-500">Impressions</p>
                <p className="text-lg font-bold text-gray-900">{toNumber(analytics.googleAds.totalImpressions)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[11px] text-gray-500">Clicks</p>
                <p className="text-lg font-bold text-gray-900">{toNumber(analytics.googleAds.totalClicks)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[11px] text-gray-500">Spend (INR)</p>
                <p className="text-lg font-bold text-gray-900">{toCurrency(analytics.googleAds.totalSpend)}</p>
              </div>
            </div>
            {analytics.googleAds.channelTotals?.length ? (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-xs text-gray-500">Channel</th>
                      <th className="text-right py-2 text-xs text-gray-500">Impressions</th>
                      <th className="text-right py-2 text-xs text-gray-500">Clicks</th>
                      <th className="text-right py-2 text-xs text-gray-500">Spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.googleAds.channelTotals.map((item, idx) => (
                      <tr key={`${item.channel}_${idx}`} className="border-b border-gray-100">
                        <td className="py-2">{String(item.channel || "UNKNOWN").replaceAll("_", " ")}</td>
                        <td className="py-2 text-right">{toNumber(item.impressions)}</td>
                        <td className="py-2 text-right">{toNumber(item.clicks)}</td>
                        <td className="py-2 text-right">{toCurrency(item.spend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-xs text-gray-500">Date</th>
                    <th className="text-left py-2 text-xs text-gray-500">Campaign</th>
                    <th className="text-left py-2 text-xs text-gray-500">Channel</th>
                    <th className="text-right py-2 text-xs text-gray-500">Impressions</th>
                    <th className="text-right py-2 text-xs text-gray-500">Clicks</th>
                    <th className="text-right py-2 text-xs text-gray-500">Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics.googleAds.rows || []).slice(0, 40).map((row, idx) => (
                    <tr key={`${row.date}_${row.campaignName}_${idx}`} className="border-b border-gray-100">
                      <td className="py-2">{row.date || "-"}</td>
                      <td className="py-2">{row.campaignName || "-"}</td>
                      <td className="py-2">{String(row.channelType || "UNKNOWN").replaceAll("_", " ")}</td>
                      <td className="py-2 text-right">{toNumber(row.impressions)}</td>
                      <td className="py-2 text-right">{toNumber(row.clicks)}</td>
                      <td className="py-2 text-right">{toCurrency(row.spend)}</td>
                    </tr>
                  ))}
                  {!analytics.googleAds.rows?.length ? (
                    <tr>
                      <td className="py-3 text-gray-400 text-sm" colSpan={6}>No Google ads data available for this date range.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
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
