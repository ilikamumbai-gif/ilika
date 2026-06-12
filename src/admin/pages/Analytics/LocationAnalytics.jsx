import React, { useEffect, useMemo, useState } from "react";
import {
  Globe,
  MapPinned,
  Map,
  Navigation,
  ShoppingCart,
  Eye,
  MousePointerClick,
  Users,
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

const createDefaultDateRange = () => {
  const today = new Date();
  const from = new Date();
  from.setDate(today.getDate() - 29);
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

const isIndiaLabel = (label = "") => {
  const normalized = String(label || "").trim().toLowerCase();
  return normalized === "india" || normalized === "in";
};

const DEFAULT_LOCATION_LIST_LIMIT = 5;

const StatCard = ({ title, value, hint, icon: Icon, tone = "pink" }) => {
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

const LocationSummaryCard = ({ title, rows, icon: Icon }) => (
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

const LocationActivityCard = ({ rows = [], loading }) => (
  <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
    <div className="mb-4 flex items-center gap-3">
      <div className="grid h-10 w-10 place-content-center rounded-2xl bg-blue-50 text-blue-600">
        <Globe size={18} />
      </div>
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800">Activity by Location</h2>
        <p className="text-xs text-gray-500">Location-wise event counts for pages, product views, and cart activity.</p>
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
                {row.pageViews} / {row.productViews} / {row.addToCarts}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-full bg-white px-2.5 py-1">page_view: {row.pageViews}</span>
              <span className="rounded-full bg-white px-2.5 py-1">product_view: {row.productViews}</span>
              <span className="rounded-full bg-white px-2.5 py-1">add_to_cart: {row.addToCarts}</span>
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
      eventCounts: { page_view: 0, product_view: 0, add_to_cart: 0 },
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
  const [error, setError] = useState("");

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

        setPayload({
          events: Array.isArray(data?.events) ? data.events : [],
          summary: data?.summary || payload.summary,
          filterOptions: data?.filterOptions || payload.filterOptions,
        });
      } catch (loadError) {
        console.error("Location analytics load error:", loadError);
        setError(loadError.message || "Failed to load location analytics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filters, getAdminAuthHeaders, refreshSignal]);

  const recentEvents = useMemo(() => payload.events.slice(0, 25), [payload.events]);
  const countrySummaryRows = useMemo(
    () => payload.summary.byCountry.filter((row) => isIndiaLabel(row.label)),
    [payload.summary.byCountry]
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Location Analytics</h1>
        <p className="mt-0.5 text-sm text-gray-400">
          Anonymous visitor activity by page, product, cart action, and approximate IP-based location.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-800">Filters</h2>
            <p className="text-xs text-gray-500">Refine visitor events by date, location, event type, or product.</p>
          </div>
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
              {payload.filterOptions.states.map((item) => (
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
              {payload.filterOptions.cities.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Product</span>
            <select
              value={filters.product}
              onChange={(e) => setFilters((prev) => ({ ...prev, product: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-pink-400"
            >
              <option value="">All products</option>
              {payload.filterOptions.products.map((item) => (
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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total visitors"
          value={loading ? "..." : payload.summary.totalVisitors.toLocaleString("en-IN")}
          hint={`${payload.summary.totalSessions.toLocaleString("en-IN")} sessions`}
          icon={Users}
          tone="pink"
        />
        <StatCard
          title="Page views"
          value={loading ? "..." : payload.summary.eventCounts.page_view.toLocaleString("en-IN")}
          hint="Anonymous page visit events"
          icon={Globe}
          tone="blue"
        />
        <StatCard
          title="Product views"
          value={loading ? "..." : payload.summary.eventCounts.product_view.toLocaleString("en-IN")}
          hint="Product detail opens"
          icon={Eye}
          tone="amber"
        />
        <StatCard
          title="Add to cart"
          value={loading ? "..." : payload.summary.eventCounts.add_to_cart.toLocaleString("en-IN")}
          hint="Cart actions by anonymous visitors"
          icon={ShoppingCart}
          tone="emerald"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <LocationSummaryCard title="Visitors by Country" rows={countrySummaryRows} icon={MapPinned} />
        <LocationSummaryCard title="Visitors by State" rows={payload.summary.byState} icon={Map} />
        <LocationSummaryCard title="Visitors by City" rows={payload.summary.byCity} icon={Navigation} />
      </div>

      <div className="mb-6 grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <LocationActivityCard rows={payload.summary.activityByLocation} loading={loading} />

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
            ) : payload.summary.cartByLocation.length === 0 ? (
              <p className="rounded-xl bg-gray-50 px-3 py-8 text-center text-sm text-gray-400">No add-to-cart events for current filters</p>
            ) : (
              payload.summary.cartByLocation.slice(0, 12).map((row, index) => (
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
              <p className="text-xs text-gray-500">Latest anonymous visitor events across pages, product views, and carts.</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {payload.events.length.toLocaleString("en-IN")} events
            </span>
          </div>

          <div className="space-y-3 lg:hidden">
            {loading ? (
              <p className="rounded-xl bg-gray-50 px-3 py-8 text-center text-sm text-gray-400">Loading visitor analytics...</p>
            ) : recentEvents.length === 0 ? (
              <p className="rounded-xl bg-gray-50 px-3 py-8 text-center text-sm text-gray-400">No visitor events found for current filters</p>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
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
                  <th className="px-3 py-3">Event</th>
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
                ) : recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-3 py-10 text-center text-sm text-gray-400">No visitor events found for current filters</td>
                  </tr>
                ) : (
                  recentEvents.map((event) => (
                    <tr key={event.id} className="border-b border-gray-100 align-top">
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
