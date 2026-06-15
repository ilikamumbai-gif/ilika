import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, Copy } from "lucide-react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import CartDrawer from "../components/CartDrawer";

const API_URL = import.meta.env.VITE_API_URL;

const readParams = (search = "") => {
  const qp = new URLSearchParams(search);
  return {
    order: String(qp.get("order") || "").trim(),
    trackingId: String(qp.get("trackingId") || "").trim(),
    courier: String(qp.get("courier") || "").trim(),
    trackingUrl: String(qp.get("trackingUrl") || "").trim(),
    shippingStatus: String(qp.get("shippingStatus") || "").trim(),
  };
};

const TRACK_STEPS = [
  { key: "processing", label: "Order Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "out-for-delivery", label: "Out For Delivery" },
  { key: "delivered", label: "Delivered" },
];

const normalizeStatusKey = (status = "") => {
  const value = String(status || "").toLowerCase();
  if (
    value.includes("out for delivery") ||
    value.includes("assigned for delivery") ||
    value.includes("customer not contactable") ||
    value === "nc"
  ) {
    return "out-for-delivery";
  }
  if (value.includes("delivered")) return "delivered";
  if (
    value.includes("ship") ||
    value.includes("pick") ||
    value.includes("pickup") ||
    value.includes("delivery center") ||
    value.includes("forward hub") ||
    value.includes("received at") ||
    value.includes("transit")
  ) {
    return "shipped";
  }
  return "processing";
};

const toTitleCase = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const formatActivityLabel = (raw = "") => {
  const key = String(raw || "").toLowerCase().trim();
  const map = {
    delivered: "Delivered",
    ofd: "Out for Delivery",
    "out for delivery": "Out for Delivery",
    assigned_for_delivery: "Assigned for Delivery",
    recd_at_fwd_hub: "Received at Forward Hub",
    recd_at_fwd_dc: "Received at Delivery Center",
    picked: "Picked Up",
    ofp: "Out for Pickup",
    assigned_for_seller_pickup: "Assigned for Seller Pickup",
    shipped: "Shipped",
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
  };
  return map[key] || toTitleCase(raw) || "Status Update";
};

const formatActivityDetails = (activity = {}) => {
  const details = String(activity.details || "").trim();
  if (details) return details;
  const label = formatActivityLabel(activity.status);
  const location = String(activity.location || "").trim();
  return location ? `${label} at ${location}` : label;
};

const formatActivityTime = (value = "") => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusStyles = (key = "") => {
  if (key === "delivered") {
    return {
      pill: "bg-green-100 text-green-700 border-green-200",
      title: "Delivered",
      subtitle: "Your shipment has been delivered successfully.",
    };
  }
  if (key === "out-for-delivery") {
    return {
      pill: "bg-amber-100 text-amber-700 border-amber-200",
      title: "Out For Delivery",
      subtitle: "Your parcel is on the way and should arrive soon.",
    };
  }
  if (key === "shipped") {
    return {
      pill: "bg-blue-100 text-blue-700 border-blue-200",
      title: "Shipped",
      subtitle: "Your package is in transit with the courier.",
    };
  }
  return {
    pill: "bg-gray-100 text-gray-700 border-gray-200",
    title: "Processing",
    subtitle: "Your order is being prepared for dispatch.",
  };
};

const TrackOrder = () => {
  const { search } = useLocation();
  const { order, trackingId, courier, trackingUrl, shippingStatus } = useMemo(
    () => readParams(search),
    [search]
  );

  const hasTrackingData = Boolean(trackingId || trackingUrl);
  const [liveTracking, setLiveTracking] = useState(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopyTrackingId = async () => {
    if (!trackingId) return;
    try {
      await navigator.clipboard.writeText(trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    const fetchLiveTracking = async () => {
      if (!trackingId || !API_URL) return;
      setLoadingLive(true);
      setLiveError("");
      try {
        const res = await fetch(
          `${API_URL}/api/shipping/track/${encodeURIComponent(trackingId)}`
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Unable to fetch live tracking");
        setLiveTracking(data || null);
      } catch (error) {
        setLiveError(error?.message || "Unable to fetch live tracking");
      } finally {
        setLoadingLive(false);
      }
    };

    fetchLiveTracking();
  }, [trackingId]);

  const effectiveStatus =
    String(liveTracking?.status || "").trim() || shippingStatus || "Processing";
  const effectiveStepKey = normalizeStatusKey(effectiveStatus);
  const effectiveStepIndex = TRACK_STEPS.findIndex((s) => s.key === effectiveStepKey);
  const currentStyle = statusStyles(effectiveStepKey);

  return (
    <>
      <MiniDivider />
      <div className="bg-white min-h-screen">
        <Header />
        <CartDrawer />

        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Heading level="h1" heading="Track Your Order" />

            <div className="rounded-3xl border border-[#F3D3BE] bg-gradient-to-br from-[#FFF6F0] via-white to-[#FFF1F8] p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#A36B5D] font-semibold">
                    ilikä Shipment Tracker
                  </p>
                  <h3 className="mt-1 text-xl sm:text-2xl font-semibold text-[#5D2D2D]">
                    {currentStyle.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{currentStyle.subtitle}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${currentStyle.pill}`}
                >
                  {effectiveStatus}
                </span>
              </div>

              {!hasTrackingData ? (
                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-600">
                    Tracking details are not available yet. Please check your
                    account orders page after shipment is assigned.
                  </p>
                  <Link
                    to="/user"
                    className="inline-flex mt-3 rounded-lg bg-[#2B2A29] text-white px-4 py-2 text-sm font-semibold"
                  >
                    Go to My Account
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mt-5 rounded-2xl border border-[#F5DCCF] bg-white p-4 sm:p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-[#F5E7DC] bg-[#FFFDFC] p-3.5">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                          Order ID
                        </p>
                        <p className="text-sm font-medium text-gray-800 mt-1 break-all">
                          {order || "N/A"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#F5E7DC] bg-[#FFFDFC] p-3.5">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                          AWB / Tracking ID
                        </p>
                        <div className="mt-1 flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-800 break-all">
                            {trackingId || "N/A"}
                          </p>
                          {trackingId ? (
                            <button
                              type="button"
                              onClick={handleCopyTrackingId}
                              className="shrink-0 inline-flex items-center gap-1 rounded-md border border-[#E5C7B3] px-2 py-1 text-xs text-[#8A4F3D] hover:bg-[#FFF3EC] transition-colors"
                              aria-label="Copy tracking id"
                              title="Copy tracking ID"
                            >
                              <Copy size={12} />
                              {copied ? "Copied" : "Copy"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#F5E7DC] bg-[#FFFDFC] p-3.5">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                          Courier
                        </p>
                        <p className="text-sm font-medium text-gray-800 mt-1">
                          {liveTracking?.courier || courier || "Shiprocket"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-[#F5DCCF] bg-white p-4 sm:p-5">
                    <p className="text-xs uppercase tracking-widest text-[#A36B5D] font-semibold mb-4">
                      Delivery Progress
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {TRACK_STEPS.map((step, index) => {
                        const isDone = index <= effectiveStepIndex;
                        return (
                          <div
                            key={step.key}
                            className={`rounded-xl border p-3 transition-colors ${
                              isDone
                                ? "border-[#F3C3A6] bg-[#FFF7F2]"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                                isDone
                                  ? "bg-[#D97855] text-white"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <p
                              className={`mt-2 text-sm font-semibold ${
                                isDone ? "text-[#6A3E34]" : "text-gray-500"
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {loadingLive ? (
                    <p className="mt-4 text-sm text-gray-500">
                      Fetching live updates from Shiprocket...
                    </p>
                  ) : null}

                  {liveError ? (
                    <p className="mt-4 text-sm text-rose-600">
                      Live Shiprocket update unavailable. Showing saved status.
                    </p>
                  ) : null}

                  {Array.isArray(liveTracking?.activities) && liveTracking.activities.length ? (
                    <div className="mt-4 rounded-2xl border border-[#F5DCCF] bg-white p-4 sm:p-5">
                      <p className="text-xs uppercase tracking-widest text-[#A36B5D] font-semibold mb-4">
                        Recent Tracking Activity
                      </p>
                      <div className="space-y-4">
                        {liveTracking.activities.slice(0, 8).map((activity, idx) => {
                          const label = formatActivityLabel(activity.status);
                          const timeLabel = formatActivityTime(activity.date);
                          const details = formatActivityDetails(activity);
                          const done = Boolean(activity.date);
                          return (
                          <div key={activity.id} className="grid grid-cols-[86px_22px_1fr] sm:grid-cols-[96px_22px_1fr] gap-3 sm:gap-4">
                            <div className="text-[11px] sm:text-xs font-medium text-gray-500 pt-0.5 leading-5">
                              {timeLabel}
                            </div>

                            <div className="relative flex justify-center">
                              <span
                                className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  done
                                    ? "bg-[#40BF6A] border-[#40BF6A] text-white"
                                    : "bg-[#E5E7EB] border-[#D1D5DB] text-[#9CA3AF]"
                                }`}
                              >
                                <Check size={11} strokeWidth={3} />
                              </span>
                              {idx < Math.min(liveTracking.activities.length, 8) - 1 ? (
                                <span
                                  className={`absolute top-5 bottom-[-22px] w-[2px] ${
                                    done ? "bg-[#B7E8C7]" : "bg-gray-200"
                                  }`}
                                />
                              ) : null}
                            </div>

                            <div className="pb-5">
                              <p className="text-base font-semibold text-[#2D2D2D]">{label}</p>
                              <p className="text-sm text-gray-500 mt-1">{details}</p>
                              {activity.location ? (
                                <p className="text-xs text-gray-400 mt-1">{activity.location}</p>
                              ) : null}
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to="/user"
                      className="inline-flex rounded-lg bg-[#2B2A29] hover:bg-[#1a1918] text-white px-4 py-2 text-sm font-semibold transition-colors"
                    >
                      Back to My Account
                    </Link>
                    {trackingUrl ? (
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-lg border border-[#D97855] text-[#D97855] hover:bg-[#FFF2EB] px-4 py-2 text-sm font-semibold transition-colors"
                      >
                        Open Official Courier Link
                      </a>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default TrackOrder;
