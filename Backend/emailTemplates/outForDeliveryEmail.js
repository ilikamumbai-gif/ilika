import {
  createEmailLayout,
  createFactsMarkup,
  escapeHtml,
  formatDateLabel,
  resolveSupportEmail,
} from "./_shared.js";

export const getOutForDeliveryEmail = ({
  customerName = "",
  orderId = "",
  productName = "",
  trackingLink = "",
  deliveryDate = "",
  supportEmail = "",
} = {}) => {
  const safeSupportEmail = resolveSupportEmail(supportEmail);
  const greetingName = customerName || "there";
  const arrivalDate = formatDateLabel(deliveryDate);

  const facts = createFactsMarkup([
    { label: "Order ID", value: orderId || "Ilika Order" },
    { label: "Product", value: productName || "Your Ilika product" },
    { label: "Delivery Date", value: arrivalDate || "Today" },
  ]);

  const html = createEmailLayout({
    previewText: `Your Ilika order ${orderId || ""} is out for delivery.`,
    eyebrow: "OUT FOR DELIVERY",
    title: "Your package should arrive today",
    intro: `Hi ${escapeHtml(greetingName)}, your Ilika order is out for delivery and should reach you very soon.`,
    ctaLabel: trackingLink ? "View Tracking" : "",
    ctaUrl: trackingLink,
    supportEmail: safeSupportEmail,
    body: `
      <p style="margin:0 0 14px;">Please keep your phone nearby so the courier can reach you if needed.</p>
      ${facts}
      <p style="margin:20px 0 0;">We hope your Ilika experience starts beautifully the moment your package arrives.</p>
    `,
  });

  return {
    subject: `Out for Delivery - ${orderId || "Ilika Order"}`,
    html,
  };
};

export default getOutForDeliveryEmail;
