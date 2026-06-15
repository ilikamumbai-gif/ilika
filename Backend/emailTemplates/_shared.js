const DEFAULT_SUPPORT_EMAIL = "customersupport.ilika@gmail.com";

export const escapeHtml = (value = "") =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const formatDateLabel = (value = "") => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDaysLabel = (value = "") => {
  const days = Number(value);
  if (!Number.isFinite(days) || days <= 0) return "";
  return `${days} ${days === 1 ? "day" : "days"}`;
};

export const resolveSupportEmail = (supportEmail = "") =>
  String(supportEmail || "").trim() || DEFAULT_SUPPORT_EMAIL;

export const createFactsMarkup = (facts = []) => {
  const rows = facts
    .filter((fact) => fact && fact.label && fact.value)
    .map(
      (fact) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #efe7df;color:#7a675d;font-size:13px;width:38%;">${escapeHtml(
            fact.label
          )}</td>
          <td style="padding:10px 0;border-bottom:1px solid #efe7df;color:#2b211d;font-size:14px;font-weight:600;">${escapeHtml(
            fact.value
          )}</td>
        </tr>
      `
    )
    .join("");

  if (!rows) return "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;border-collapse:collapse;">
      ${rows}
    </table>
  `;
};

export const createEmailLayout = ({
  previewText = "",
  eyebrow = "ILIKA",
  title = "",
  intro = "",
  body = "",
  ctaLabel = "",
  ctaUrl = "",
  supportEmail = "",
}) => {
  const safeSupportEmail = resolveSupportEmail(supportEmail);
  const safePreviewText = escapeHtml(previewText);
  const safeEyebrow = escapeHtml(eyebrow);
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const buttonMarkup =
    ctaLabel && ctaUrl
      ? `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 10px;">
          <tr>
            <td align="center" bgcolor="#2f7d5f" style="border-radius:999px;">
              <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 26px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">
                ${escapeHtml(ctaLabel)}
              </a>
            </td>
          </tr>
        </table>
      `
      : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>${safeTitle}</title>
        <style>
          body, table, td, a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          table, td {
            mso-table-rspace: 0pt;
            mso-table-lspace: 0pt;
          }
          img {
            -ms-interpolation-mode: bicubic;
          }
          img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
          }
          table {
            border-collapse: collapse !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: #f6f1ec;
          }
          @media screen and (max-width: 640px) {
            .email-shell {
              width: 100% !important;
            }
            .email-card {
              border-radius: 20px !important;
            }
            .email-pad {
              padding: 28px 20px !important;
            }
            .email-title {
              font-size: 28px !important;
              line-height: 34px !important;
            }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background:#f6f1ec;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
          ${safePreviewText}
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1ec;">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" width="620" cellpadding="0" cellspacing="0" class="email-shell" style="width:620px;max-width:100%;">
                <tr>
                  <td class="email-card" style="background:linear-gradient(180deg,#fff9f4 0%,#ffffff 18%,#ffffff 100%);border-radius:28px;overflow:hidden;box-shadow:0 18px 50px rgba(70,42,26,0.10);">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#efe3d5 0%,#f9efe6 50%,#e3f0e9 100%);padding:18px 24px;">
                          <div style="font-size:12px;letter-spacing:0.24em;font-weight:700;color:#7b5e4f;">${safeEyebrow}</div>
                        </td>
                      </tr>
                      <tr>
                        <td class="email-pad" style="padding:38px 34px 28px;">
                          <div style="display:inline-block;padding:7px 12px;border-radius:999px;background:#f2e6dc;color:#8a614f;font-size:11px;font-weight:700;letter-spacing:0.14em;">
                            SKINCARE • HAIRCARE • APPLIANCES
                          </div>
                          <h1 class="email-title" style="margin:18px 0 10px;font-size:34px;line-height:40px;color:#2b211d;font-weight:700;">
                            ${safeTitle}
                          </h1>
                          <p style="margin:0;color:#6f5a50;font-size:15px;line-height:25px;">
                            ${safeIntro}
                          </p>
                          ${buttonMarkup}
                          <div style="margin-top:20px;color:#4e4039;font-size:14px;line-height:24px;">
                            ${body}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 34px 34px;">
                          <div style="border-top:1px solid #efe4da;padding-top:18px;color:#826d61;font-size:12px;line-height:20px;">
                            <strong style="display:block;color:#5a463c;margin-bottom:6px;">Need help?</strong>
                            For support, contact
                            <a href="mailto:${escapeHtml(safeSupportEmail)}" style="color:#2f7d5f;text-decoration:none;font-weight:700;">
                              ${escapeHtml(safeSupportEmail)}
                            </a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};
