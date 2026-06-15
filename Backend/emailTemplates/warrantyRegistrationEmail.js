import {
  createEmailLayout,
  createFactsMarkup,
  escapeHtml,
  resolveSupportEmail,
} from "./_shared.js";

export const getWarrantyRegistrationEmail = ({
  customerName = "",
  orderId = "",
  productName = "",
  warrantyRegistrationLink = "",
  supportEmail = "",
} = {}) => {
  const safeSupportEmail = resolveSupportEmail(supportEmail);
  const greetingName = customerName || "there";

  const facts = createFactsMarkup([
    { label: "Customer", value: customerName || "Valued customer" },
    { label: "Order ID", value: orderId || "Ilika Order" },
    { label: "Product", value: productName || "Ilika appliance" },
  ]);

  const html = createEmailLayout({
    previewText: `Register your Ilika warranty for order ${orderId || ""}.`,
    eyebrow: "WARRANTY REGISTRATION",
    title: "Register your Ilika warranty",
    intro: `Hi ${escapeHtml(greetingName)}, thank you for choosing Ilika. Now that your order has been delivered, please register your warranty to complete your post-delivery process.`,
    ctaLabel: warrantyRegistrationLink ? "Register Warranty" : "",
    ctaUrl: warrantyRegistrationLink,
    supportEmail: safeSupportEmail,
    body: `
      <p style="margin:0 0 14px;">Warranty registration is compulsory and should be completed after delivery so your purchase is properly recorded for future support.</p>
      ${facts}
      <p style="margin:20px 0 0;">Please keep your order information handy while completing the registration form. Once registered, our team can assist you faster whenever needed.</p>
    `,
  });

  return {
    subject: `Register Your Ilika Warranty - Order #${orderId || "Ilika Purchase"}`,
    html,
  };
};

export default getWarrantyRegistrationEmail;
