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
  const [analytics, setAnalytics] = useState({
    fullTraffic: [],
    metaClick: [],
    googleClick: [],
    organicSearch: [],
    revenue: { meta: 0, google: 0, organic: 0 },
  });

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL;
    const headers = {
      "Content-Type": "application/json",
      ...getAdminAuthHeaders(),
    };

    const endpointCandidates = [
      `${API}/api/analytics`,
      `${API}/api/analytics/overview`,
      `${API}/api/admin/analytics`,
      `${API}/api/marketing/analytics`,
    ];

    const load = async () => {
      setLoading(true);
      setError("");
      let payload = null;
      for (const endpoint of endpointCandidates) {
        try {
          const res = await fetch(endpoint, { headers });
          if (!res.ok) continue;
          payload = await res.json();
          if (payload) break;
        } catch (err) {
          // try next endpoint
        }
      }

      if (!payload) {
        setError("Unable to fetch analytics data from backend.");
        setLoading(false);
        return;
      }

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
      setLoading(false);
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
        <div className="bg-white border border-red-200 rounded-xl p-8 text-sm text-red-600">{error}</div>
      ) : (
        <div className="space-y-5">
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
