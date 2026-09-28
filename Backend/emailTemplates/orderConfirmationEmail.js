import {
  createEmailLayout,
  createFactsMarkup,
  escapeHtml,
  formatDaysLabel,
  formatDateLabel,
  resolveSupportEmail,
} from "./_shared.js";

export const getOrderConfirmationEmail = ({
  customerName = "",
  orderId = "",
  productName = "",
  items = [],
  totalAmount = "",
  shippingAddress = {},
  estimatedDeliveryDays = "",
  deliveryDate = "",
  supportEmail = "",
} = {}) => {
  const safeSupportEmail = resolveSupportEmail(supportEmail);
  const greetingName = customerName || "there";
  const deliveryWindow = formatDaysLabel(estimatedDeliveryDays);
  const expectedDeliveryDate = formatDateLabel(deliveryDate);
  const formattedTotal = Number.isFinite(Number(totalAmount))
    ? `Rs ${Number(totalAmount).toFixed(2)}`
    : String(totalAmount || "").trim();
  const addressLines = [
    shippingAddress?.name,
    shippingAddress?.phone,
    shippingAddress?.addressLine || shippingAddress?.address,
    [shippingAddress?.city, shippingAddress?.state, shippingAddress?.pincode]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .map((line) => escapeHtml(line))
    .join("<br />");
  const itemRows = Array.isArray(items)
    ? items
        .map((item, index) => {
          const qty = Number(item?.quantity || 1);
          const unitPrice = Number(item?.price || 0);
          const lineTotal = qty * unitPrice;
          return `
            <tr>
              <td style="padding:10px 12px;border-bottom:1px solid #efe7df;color:#2b211d;font-size:14px;">
                <strong>${index + 1}. ${escapeHtml(item?.name || productName || "Ilika Product")}</strong>
                ${item?.variantLabel ? `<div style="margin-top:4px;color:#7a675d;font-size:12px;">${escapeHtml(item.variantLabel)}</div>` : ""}
              </td>
              <td style="padding:10px 12px;border-bottom:1px solid #efe7df;color:#2b211d;font-size:14px;text-align:center;">${qty}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #efe7df;color:#2b211d;font-size:14px;text-align:right;">Rs ${lineTotal.toFixed(2)}</td>
            </tr>
          `;
        })
        .join("")
    : "";

  const facts = createFactsMarkup([
    { label: "Customer", value: customerName || "Valued customer" },
    { label: "Order ID", value: orderId || "Will be shared shortly" },
    { label: "Product", value: productName || "Your Ilika selection" },
    { label: "Estimated Dispatch Window", value: deliveryWindow || "Preparing now" },
    { label: "Expected Delivery Date", value: expectedDeliveryDate || "Will be shared soon" },
    { label: "Order Total", value: formattedTotal || "Will be shared soon" },
  ]);

  const html = createEmailLayout({
    previewText: `Your Ilika order ${orderId || ""} has been confirmed.`,
    eyebrow: "ORDER CONFIRMED",
    title: "Your Ilika order is confirmed",
    intro: `Hi ${escapeHtml(greetingName)}, thank you for shopping with Ilika. We have received your order and our team is getting it ready with care.`,
    supportEmail: safeSupportEmail,
    body: `
      <p style="margin:0 0 14px;">We are now reviewing your order details, preparing your products, and getting everything ready for dispatch.</p>
      ${facts}
      ${
        itemRows
          ? `
            <h3 style="margin:24px 0 10px;color:#2b211d;font-size:18px;">Order Summary</h3>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #efe7df;border-radius:14px;overflow:hidden;">
              <thead>
                <tr style="background:#faf5ef;">
                  <th style="padding:12px;text-align:left;color:#7a675d;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Product</th>
                  <th style="padding:12px;text-align:center;color:#7a675d;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Qty</th>
                  <th style="padding:12px;text-align:right;color:#7a675d;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>
          `
          : ""
      }
      ${
        addressLines
          ? `
            <h3 style="margin:24px 0 10px;color:#2b211d;font-size:18px;">Shipping Address</h3>
            <div style="background:#faf7f2;border:1px solid #efe7df;border-radius:14px;padding:16px;color:#4e4039;font-size:14px;line-height:24px;">
              ${addressLines}
            </div>
          `
          : ""
      }
      <p style="margin:20px 0 0;">You will receive another update as soon as your order ships.</p>
      <p style="margin:12px 0 0;">For support, contact <a href="mailto:${escapeHtml(
        safeSupportEmail
      )}" style="color:#2f7d5f;text-decoration:none;font-weight:700;">${escapeHtml(safeSupportEmail)}</a>.</p>
    `,
  });

  return {
    subject: `Your Ilika Order is Confirmed - #${orderId || "Ilika Order"}`,
    html,
  };
};

export default getOrderConfirmationEmail;
