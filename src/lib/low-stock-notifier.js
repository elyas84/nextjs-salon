import { sendEmail } from "@/lib/mailer";

const LOW_STOCK_THRESHOLD = 5;

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

let lowStockEnvWarned = false;

function lowStockRecipients() {
  const raw =
    process.env.STOCK_ADMIN_EMAIL ||
    process.env.INVENTORY_ADMIN_EMAIL ||
    process.env.CONTACT_RECEIVER_EMAIL ||
    process.env.SMTP_FROM ||
    "";
  return String(raw)
    .split(/[,;]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function adminPanelUrl() {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    ""
  ).replace(/\/$/, "");
  return base ? `${base}/admin` : "";
}

function buildLowStockEmailHtml({ product }) {
  const adminUrl = adminPanelUrl();
  const linkBlock = adminUrl
    ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#0f172a;">
        <a href="${escapeHtml(adminUrl)}" style="color:#0f172a;font-weight:700;">Open admin inventory</a>
      </p>`
    : "";

  return `
  <div style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:separate;border-spacing:0;border:1px solid #e2e8f0;border-radius:16px;background:#ffffff;overflow:hidden;">
            <tr>
              <td style="padding:22px 24px;border-bottom:1px solid #e2e8f0;">
                <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#0f172a;">Low stock alert</p>
                <h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;color:#0f172a;">${escapeHtml(product?.name || "Product")}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px;">
                <div style="padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:14px;color:#0f172a;line-height:1.6;">
                  <div><strong>Remaining stock:</strong> ${escapeHtml(product?.stockCount)}</div>
                  <div style="margin-top:6px;"><strong>Threshold:</strong> ${escapeHtml(LOW_STOCK_THRESHOLD)} (alert triggers when stock is below this)</div>
                  <div style="margin-top:6px;"><strong>Slug:</strong> ${escapeHtml(product?.slug || "—")}</div>
                  <div style="margin-top:6px;"><strong>Status:</strong> ${escapeHtml(product?.inStock ? "In stock" : "Out of stock")}</div>
                </div>
                ${linkBlock}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

/**
 * Send a low-stock email once when stock drops below threshold.
 * Anti-spam: send only if `product.lowStockNotified` is false; reset when restocked.
 */
export async function maybeNotifyLowStock({ product, previousStockCount }) {
  if (!product) return;
  const prev = Number(previousStockCount ?? NaN);
  const next = Number(product.stockCount ?? NaN);
  if (!Number.isFinite(next)) return;

  // Reset notification state once restocked back to threshold or above.
  if (next >= LOW_STOCK_THRESHOLD) return { action: "reset" };

  // Optional transition check: if prev was already below threshold, don't re-notify.
  if (Number.isFinite(prev) && prev < LOW_STOCK_THRESHOLD) return { action: "none" };

  if (product.lowStockNotified) return { action: "none" };

  const recipients = lowStockRecipients();
  if (!recipients.length) {
    if (!lowStockEnvWarned) {
      lowStockEnvWarned = true;
      console.warn(
        "Low stock alerts: set STOCK_ADMIN_EMAIL (or CONTACT_RECEIVER_EMAIL / SMTP_FROM) to notify admins by email.",
      );
    }
    return { action: "skipped_no_recipients" };
  }

  await sendEmail({
    to: recipients.join(", "),
    subject: `[Admin] Low stock: ${String(product?.name || "Product").trim().slice(0, 80)}`,
    html: buildLowStockEmailHtml({ product }),
  });

  return { action: "emailed" };
}

