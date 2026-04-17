/**
 * Transactional HTML for password reset (Studio Salon / zinc + rose).
 * Inline styles only — email-client safe.
 */
function escapeHtmlAttr(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function escapeHtmlText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildResetPasswordEmailHtml({ resetUrl, userEmail }) {
  const safeEmail = escapeHtmlText(userEmail);
  const hrefUrl = escapeHtmlAttr(resetUrl);
  const textUrl = escapeHtmlText(resetUrl);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset your password</title>
  </head>
  <body style="margin:0;padding:0;background:#09090b;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#09090b;padding:40px 16px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;background:#18181b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="height:3px;background:linear-gradient(90deg,transparent,rgba(219,39,119,0.85),transparent);"></td>
            </tr>
            <tr>
              <td style="padding:28px 32px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.03em;color:#fafafa;">
                  Studio <span style="color:#f472b6;">Salon</span>
                </p>
                <p style="margin:8px 0 0;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#a1a1aa;">
                  Hair &amp; beauty
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0;">
                <span style="display:inline-block;border:1px solid rgba(244,114,182,0.35);background:rgba(244,114,182,0.1);color:#fbcfe8;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;padding:6px 12px;border-radius:6px;">
                  Security notice
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 8px;">
                <h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#fafafa;line-height:1.2;">
                  Reset password requested
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 20px;">
                <p style="margin:0;font-size:14px;line-height:1.65;color:#a1a1aa;">
                  We received a reset request for
                  <span style="color:#e4e4e7;font-weight:600;">${safeEmail}</span>.
                  Use the secure link below to choose a new password. This link expires in <strong style="color:#e4e4e7;">30 minutes</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;">
                <a href="${hrefUrl}" style="display:inline-block;background:linear-gradient(90deg,#db2777,#f472b6);color:#18181b;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:10px;">
                  Reset password →
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;">
                  If the button does not work, copy and paste this URL into your browser:
                </p>
                <p style="margin:10px 0 0;font-size:11px;line-height:1.5;word-break:break-all;">
                  <a href="${hrefUrl}" style="color:#f472b6;text-decoration:underline;">${textUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px 28px;">
                <p style="margin:0;font-size:12px;line-height:1.65;color:#71717a;">
                  If you did not request this reset, you can ignore this email — your password will stay the same.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.2);">
                <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#52525b;">
                  © ${new Date().getFullYear()} Studio Salon — Secure account access
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
