import { db } from "../firebaseAdmin.js";
import { sendEmail, isEmailConfigured } from "./emailService.js";
import getOrderConfirmationEmail from "../emailTemplates/orderConfirmationEmail.js";
import getOrderShippedEmail from "../emailTemplates/orderShippedEmail.js";
import getOutForDeliveryEmail from "../emailTemplates/outForDeliveryEmail.js";
import getDeliveryExpectedEmail from "../emailTemplates/deliveryExpectedEmail.js";
import getDeliveredEmail from "../emailTemplates/deliveredEmail.js";
import getWarrantyRegistrationEmail from "../emailTemplates/warrantyRegistrationEmail.js";
import getFeedbackEmail from "../emailTemplates/feedbackEmail.js";

const getSiteUrl = () =>
  String(process.env.SITE_URL || process.env.FRONTEND_URL || "https://ilika.in").replace(/\/+$/, "");

const getSupportEmail = () =>
  process.env.CUSTOMER_SUPPORT_EMAIL ||
  process.env.EMAIL_FROM ||
  process.env.EMAIL_USER ||
  "customersupport.ilika@gmail.com";

const buildShiprocketTrackingUrl = (awb = "") =>
  awb ? `https://shiprocket.co/tracking/${encodeURIComponent(awb)}` : "";

export const normalizeShiprocketStatusBucket = (status = "", trackingData = {}) => {
  const normalized = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  if (!normalized) return "";
  if (
    normalized.includes("out for delivery") ||
    normalized === "ofd" ||
    normalized.includes("assigned for delivery") ||
    normalized.includes("customer not contactable") ||
    normalized === "nc"
  ) {
    return "outForDelivery";
  }
  if (normalized.includes("delivered")) return "delivered";
  if ((normalized.includes("in transit") || normalized.includes("transit")) && trackingData?.etd) {
    return "deliveryExpected";
  }
  if (
    normalized.includes("ship") ||
    normalized.includes("pick") ||
    normalized.includes("pickup") ||
    normalized.includes("delivery center") ||
    normalized.includes("forward hub") ||
    normalized.includes("received at")
  ) {
    return "shipped";
  }
  return "";
};

const getEstimatedDeliveryDays = (deliveryDate = "") => {
  if (!deliveryDate) return "";
  const date = new Date(deliveryDate);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : "";
};

const buildTemplatePayload = ({ order = {}, trackingData = {} }) => {
  const shippingAddress = order?.shippingAddress || {};
  const items = Array.isArray(order?.items) ? order.items : [];
  const productName =
    items.map((item) => String(item?.name || "").trim()).filter(Boolean).join(", ") ||
    "Your Ilika product";

  return {
    customerName:
      String(shippingAddress?.name || "").trim() ||
      String(order?.userName || "").trim() ||
      "Customer",
    orderId: order?.id || "",
    productName,
    trackingLink:
      String(order?.tracking?.trackingUrl || "").trim() ||
      buildShiprocketTrackingUrl(trackingData?.awb || order?.tracking?.trackingId || ""),
    estimatedDeliveryDays: getEstimatedDeliveryDays(trackingData?.etd),
    deliveryDate: trackingData?.deliveredDate || trackingData?.etd || "",
    warrantyRegistrationLink: `${getSiteUrl()}/warranty-registration`,
    feedbackLink: `${getSiteUrl()}/feedback`,
    supportEmail: getSupportEmail(),
  };
};

export const buildOrderEmailTemplate = ({ type = "", order = {}, trackingData = {} }) => {
  const payload = buildTemplatePayload({ order, trackingData });
  if (type === "orderConfirmation") {
    return {
      ...getOrderConfirmationEmail({
        ...payload,
        items: Array.isArray(order?.items) ? order.items : [],
        totalAmount: Number(order?.totalAmount || 0),
        shippingAddress: order?.shippingAddress || {},
      }),
    };
  }
  if (type === "shipped") return getOrderShippedEmail(payload);
  if (type === "outForDelivery") return getOutForDeliveryEmail(payload);
  if (type === "deliveryExpected") return getDeliveryExpectedEmail(payload);
  if (type === "delivered") return getDeliveredEmail(payload);
  if (type === "warranty") return getWarrantyRegistrationEmail(payload);
  if (type === "feedback") return getFeedbackEmail(payload);
  return null;
};

export const sendOrderEmailByType = async ({ type = "", order = {}, trackingData = {} }) => {
  const orderId = String(order?.id || "").trim();
  const customerEmail = String(order?.userEmail || "").trim();

  if (!customerEmail) {
    console.warn("[order-email-trigger] Skipped: missing customer email", { orderId, type });
    return { status: "skipped", reason: "missing_customer_email" };
  }

  if (!isEmailConfigured()) {
    console.warn("[order-email-trigger] Skipped: email not configured", { orderId, type });
    return { status: "skipped", reason: "missing_smtp_credentials" };
  }

  const template = buildOrderEmailTemplate({ type, order, trackingData });
  if (!template) {
    console.warn("[order-email-trigger] Skipped: unsupported type", { orderId, type });
    return { status: "skipped", reason: "unsupported_tracking_bucket" };
  }

  const result = await sendEmail(customerEmail, template.subject, template.html);
  return result.ok
    ? { status: "sent", messageId: result.messageId || "" }
    : { status: result.status, reason: result.reason || "email_send_failed" };
};

const buildEmailStatusValue = (existing = {}, result = {}) => ({
  sent: result.status === "sent",
  sentAt: result.status === "sent" ? new Date() : existing?.sentAt || null,
});

export const triggerOrderEmailAutomation = async ({
  order = {},
  oldTrackingStatus = "",
  newTrackingStatus = "",
  trackingData = {},
}) => {
  const safeOrderId = String(order?.id || "").trim();
  if (!safeOrderId) {
    console.warn("[order-email-trigger] Skipped: missing order id");
    return { ok: false, reason: "missing_order_id", attempts: [] };
  }

  const attempts = [];

  try {
    const normalizedBucket = normalizeShiprocketStatusBucket(newTrackingStatus, trackingData);
    const emailStatus = order?.emailStatus || {};
    const nextEmailStatus = { ...emailStatus };
    let shouldPersist = false;

    const attemptBucket = async (bucket) => {
      const existing = nextEmailStatus?.[bucket] || {};
      if (existing?.sent === true) {
        const duplicateResult = { bucket, status: "skipped", reason: "already_sent" };
        console.log("[order-email-trigger] Duplicate skipped", {
          orderId: safeOrderId,
          oldTrackingStatus,
          newTrackingStatus,
          bucket,
        });
        attempts.push(duplicateResult);
        return duplicateResult;
      }

      console.log("[order-email-trigger] Attempting email", {
        orderId: safeOrderId,
        oldTrackingStatus,
        newTrackingStatus,
        bucket,
      });

      const result = await sendOrderEmailByType({
        type: bucket,
        order,
        trackingData,
      });

      nextEmailStatus[bucket] = buildEmailStatusValue(existing, result);
      shouldPersist = true;

      console.log("[order-email-trigger] Attempt finished", {
        orderId: safeOrderId,
        bucket,
        status: result.status,
        reason: result.reason || "",
      });

      const attempt = { bucket, ...result };
      attempts.push(attempt);
      return attempt;
    };

    let primaryAttempt = { bucket: "", status: "skipped", reason: "no_matching_bucket" };

    if (normalizedBucket) {
      const statusChanged = String(oldTrackingStatus || "").trim() !== String(newTrackingStatus || "").trim();
      if (normalizedBucket !== "deliveryExpected" && !statusChanged) {
        primaryAttempt = {
          bucket: normalizedBucket,
          status: "skipped",
          reason: "tracking_status_unchanged",
        };
        attempts.push(primaryAttempt);
      } else {
        primaryAttempt = await attemptBucket(normalizedBucket);
      }
    } else {
      attempts.push(primaryAttempt);
    }

    const deliveredEmailSentNow =
      primaryAttempt.bucket === "delivered" && primaryAttempt.status === "sent";
    const deliveredEmailSentEarlier = nextEmailStatus?.delivered?.sent === true;
    const shouldHandleDeliveredFollowups =
      normalizedBucket === "delivered" && (deliveredEmailSentNow || deliveredEmailSentEarlier);

    if (shouldHandleDeliveredFollowups) {
      await attemptBucket("warranty");
      await attemptBucket("feedback");
    }

    if (shouldPersist) {
      await db.collection("orders").doc(safeOrderId).set(
        {
          emailStatus: nextEmailStatus,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }

    return {
      ok: true,
      bucket: normalizedBucket,
      attempts,
    };
  } catch (error) {
    console.error("[order-email-trigger] Fatal error", {
      orderId: safeOrderId,
      oldTrackingStatus,
      newTrackingStatus,
      error: error?.message || error,
    });
    return {
      ok: false,
      reason: error?.message || "order_email_trigger_failed",
      attempts,
    };
  }
};
