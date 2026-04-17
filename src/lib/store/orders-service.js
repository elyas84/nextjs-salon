import fs from "node:fs/promises";
import path from "node:path";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
import { sendEmail } from "@/lib/mailer";
import { normalizeCartItem } from "@/lib/store/cart";
import { renderVatInvoicePdfBuffer } from "@/lib/store/invoice-pdf";

const LOW_STOCK_THRESHOLD = 5;
const EMAIL_LOGO_CID = "order-logo";

let legacyDeliveredMigrated = false;

async function migrateLegacyDeliveredOrdersOnce() {
  if (legacyDeliveredMigrated) return;
  await connectDB();
  await Order.updateMany({ status: "delivered" }, { $set: { status: "shipped" } });
  await Order.collection.updateMany(
    { "statusHistory.status": "delivered" },
    { $set: { "statusHistory.$[elem].status": "shipped" } },
    { arrayFilters: [{ "elem.status": "delivered" }] },
  );
  legacyDeliveredMigrated = true;
}

function mapPublicOrderStatus(status) {
  const s = String(status || "pending").toLowerCase();
  if (s === "delivered") return "shipped";
  return s;
}

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));

const getAdminReceiver = () =>
  process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_FROM || "";

const getEmailLogoAttachment = async () => {
  const logoFile = String(process.env.EMAIL_LOGO_FILE || "logo.png").trim() || "logo.png";
  const logoPath = path.join(process.cwd(), "public", logoFile);

  try {
    const content = await fs.readFile(logoPath);
    return [
      {
        filename: path.basename(logoPath),
        content,
        cid: EMAIL_LOGO_CID,
      },
    ];
  } catch {
    return [];
  }
};

const resolveSiteUrl = () => {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_URL ||
    "";

  const raw = String(env || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw}`;
};

const toAbsoluteUrl = (url) => {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const base = resolveSiteUrl();
  if (!base) return raw;
  if (raw.startsWith("/")) return `${base}${raw}`;
  return `${base}/${raw}`;
};

async function withItemImages(orders = []) {
  const list = Array.isArray(orders) ? orders : [];
  if (!list.length) return list;

  const slugs = new Set();
  list.forEach((order) => {
    (order?.items || []).forEach((item) => {
      if (item?.slug) slugs.add(String(item.slug));
    });
  });

  if (!slugs.size) return list;

  await connectDB();
  const products = await Product.find(
    { slug: { $in: Array.from(slugs) } },
    { slug: 1, gallery: 1 },
  ).lean();

  const imageBySlug = products.reduce((acc, product) => {
    const slug = String(product.slug || "");
    const primary = Array.isArray(product.gallery) ? product.gallery[0] : "";
    acc[slug] = String(primary || "");
    return acc;
  }, {});

  return list.map((order) => ({
    ...order,
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          ...item,
          image: imageBySlug[String(item.slug)] || "",
        }))
      : [],
  }));
}

const buildItemsSummaryHtml = (items = []) =>
  items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              <tr>
                <td width="56" style="vertical-align:top;padding-right:12px;">
                  ${
                    item?.image
                      ? `<img src="${escapeHtml(
                          toAbsoluteUrl(item.image),
                        )}" alt="${escapeHtml(
                          item.name,
                        )}" width="48" height="48" style="display:block;border-radius:12px;border:1px solid #e2e8f0;background:#ffffff;object-fit:cover;" />`
                      : `<div style="width:48px;height:48px;border-radius:12px;border:1px solid #e2e8f0;background:#f8fafc;"></div>`
                  }
                </td>
                <td style="vertical-align:top;">
            <div style="font-size:14px;font-weight:700;color:#0f172a;">${escapeHtml(item.name)}</div>
            <div style="margin-top:4px;font-size:12px;color:#64748b;">Qty ${escapeHtml(item.quantity)} • ${escapeHtml(item.category)}</div>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-size:14px;font-weight:700;color:#0f172a;">${formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</td>
        </tr>
      `,
    )
    .join("");

const buildStyledEmailShell = ({ logo, eyebrow, title, subtitle, body }) => `
  <div style="margin:0;padding:0;background:#f1f5f9;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:28px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;margin:0 auto;border-collapse:separate;border-spacing:0;overflow:hidden;border:1px solid #e2e8f0;border-radius:20px;background:#ffffff;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:22px 24px;border-bottom:1px solid #e2e8f0;background:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="vertical-align:middle;">
                      ${logo ? `<img src="cid:${EMAIL_LOGO_CID}" alt="eCom" style="height:34px;width:auto;display:block;" />` : `<div style="font-weight:800;letter-spacing:.04em;font-size:16px;color:#0f172a;">eCom</div>`}
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="display:inline-block;padding:6px 10px;border:1px solid #e2e8f0;border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#334155;background:#f8fafc;">
                        ${escapeHtml(eyebrow)}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 24px 8px;">
                <h1 style="margin:0;font-size:24px;line-height:1.25;color:#0f172a;">${escapeHtml(title)}</h1>
                <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:#475569;">${escapeHtml(subtitle)}</p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 22px;font-size:14px;line-height:1.75;color:#0f172a;">
                ${body}
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;">
                <p style="margin:0;font-size:12px;line-height:1.7;color:#64748b;">
                  This is an automated message from eCom. If you did not expect this email, you can safely ignore it.
                </p>
                <p style="margin:10px 0 0;font-size:12px;line-height:1.7;color:#64748b;">
                  Please don’t share sensitive information (passwords, full card numbers) by email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

const buildAdminPurchaseEmailHtml = ({ order, logo }) =>
  buildStyledEmailShell({
    logo,
    eyebrow: "Payment received",
    title: `New paid order ${order.orderNumber}`,
    subtitle: "A customer completed checkout and the order is now ready for fulfillment.",
    body: `
      <div style="margin:16px 0 18px;padding:16px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;">Customer</td>
            <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;" align="right">Total</td>
          </tr>
          <tr>
            <td style="padding:0 0 12px;font-size:14px;color:#0f172a;font-weight:700;">
              ${escapeHtml(order.customerName)}<br />
              <span style="font-weight:400;color:#475569;">${escapeHtml(order.customerEmail)}</span>
            </td>
            <td style="padding:0 0 12px;font-size:14px;color:#0f172a;font-weight:800;" align="right">
              ${formatCurrency(order.totals?.total || 0)}
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#64748b;">
              Payment: <span style="color:#0f172a;font-weight:700;">${escapeHtml(order.paymentProvider || "manual")}</span> • ${escapeHtml(order.paymentStatus || "pending")}
            </td>
            <td style="padding:6px 0;font-size:12px;color:#64748b;" align="right">
              Delivery: <span style="color:#0f172a;font-weight:700;">${escapeHtml(order.delivery || "standard")}</span>
            </td>
          </tr>
        </table>
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        ${buildItemsSummaryHtml(order.items || [])}
      </table>
      <div style="margin-top:18px;padding-top:18px;border-top:1px solid rgba(148,163,184,0.12);font-size:12px;line-height:1.7;color:#94a3b8;">
        Open the admin dashboard to mark this order as shipped when it leaves fulfillment.
      </div>
    `,
  });

const buildCustomerPurchaseEmailHtml = ({ order, logo }) =>
  buildStyledEmailShell({
    logo,
    eyebrow: "Order confirmed",
    title: `Thanks for your order, ${order.customerName}`,
    subtitle: "We’ve received your payment and your order is now being prepared.",
    body: `
      <div style="margin:16px 0 18px;padding:16px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;">Order</td>
            <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;" align="right">Total</td>
          </tr>
          <tr>
            <td style="padding:0 0 10px;font-size:14px;color:#0f172a;font-weight:800;">${escapeHtml(order.orderNumber)}</td>
            <td style="padding:0 0 10px;font-size:14px;color:#0f172a;font-weight:800;" align="right">${formatCurrency(order.totals?.total || 0)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#64748b;">
              Status: <span style="color:#0f172a;font-weight:700;">${escapeHtml(order.status || "processing")}</span>
            </td>
            <td style="padding:6px 0;font-size:12px;color:#64748b;" align="right">
              Delivery: <span style="color:#0f172a;font-weight:700;">${escapeHtml(order.delivery || "standard")}</span>
            </td>
          </tr>
        </table>
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        ${buildItemsSummaryHtml(order.items || [])}
      </table>
      <div style="margin-top:18px;padding-top:18px;border-top:1px solid rgba(148,163,184,0.12);font-size:12px;line-height:1.7;color:#94a3b8;">
        We’ll email you again when your order ships.
      </div>
    `,
  });

const buildLowStockEmailHtml = ({ order, lowStockItems, logo }) =>
  buildStyledEmailShell({
    logo,
    eyebrow: "Low stock alert",
    title: `Inventory warning for order ${order.orderNumber}`,
    subtitle: "One or more items in the latest paid order have fallen to a low stock level.",
    body: `
      <div style="margin:0 0 18px;padding:16px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:18px;color:#0f172a;">
        ${escapeHtml(lowStockItems.length)} item${lowStockItems.length === 1 ? "" : "s"} are now below the low-stock threshold of ${LOW_STOCK_THRESHOLD}.
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        ${lowStockItems
          .map(
            (item) => `
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
                  <div style="font-size:14px;font-weight:700;color:#0f172a;">${escapeHtml(item.name)}</div>
                  <div style="margin-top:4px;font-size:12px;color:#0f172a;">Remaining stock: ${escapeHtml(item.stockCount)} • Ordered: ${escapeHtml(item.quantity)}</div>
                </td>
              </tr>
            `,
          )
          .join("")}
      </table>
      <div style="margin-top:18px;padding-top:18px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.7;color:#0f172a;">
        Consider restocking soon to avoid running out.
      </div>
    `,
  });

const buildShippedEmailHtml = ({ order, logo }) =>
  buildStyledEmailShell({
    logo,
    eyebrow: "Order shipped",
    title: `Your order ${order.orderNumber} is on the way`,
    subtitle:
      "Your package has left our fulfillment center and is headed to the address on your order.",
    body: `
      <div style="margin:16px 0 18px;padding:16px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;">Order</td>
            <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;" align="right">Total</td>
          </tr>
          <tr>
            <td style="padding:0 0 10px;font-size:14px;color:#0f172a;font-weight:800;">${escapeHtml(order.orderNumber)}</td>
            <td style="padding:0 0 10px;font-size:14px;color:#0f172a;font-weight:800;" align="right">${formatCurrency(order.totals?.total || 0)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#64748b;">
              Status: <span style="color:#0f172a;font-weight:700;">Shipped</span>
            </td>
            <td style="padding:6px 0;font-size:12px;color:#64748b;" align="right">
              Delivery: <span style="color:#0f172a;font-weight:700;">${escapeHtml(order.delivery || "standard")}</span>
            </td>
          </tr>
        </table>
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        ${buildItemsSummaryHtml(order.items || [])}
      </table>
      <div style="margin:18px 0 0;padding:16px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;">Shipping to</div>
        <div style="margin-top:6px;font-size:14px;color:#0f172a;font-weight:800;">${escapeHtml(order.shippingAddress?.fullName || order.customerName)}</div>
        <div style="margin-top:4px;font-size:13px;color:#475569;line-height:1.6;">
          ${escapeHtml(order.shippingAddress?.address || "")}<br />
          ${escapeHtml(order.shippingAddress?.city || "")} ${escapeHtml(order.shippingAddress?.postalCode || "")}
        </div>
      </div>
      <div style="margin-top:18px;font-size:14px;line-height:1.75;color:#475569;">
        We don’t track final delivery in the app. If a tracking number is provided by the carrier, use it for arrival updates.
        If you need help, just reply to this email.
      </div>
    `,
  });

const buildOrderUpdateEmailHtml = ({ order, logo, statusLabel, intro }) =>
  buildStyledEmailShell({
    logo,
    eyebrow: "Order update",
    title: `Update for order ${order.orderNumber}`,
    subtitle: intro,
    body: `
      <div style="margin:16px 0 16px;padding:16px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;">Status</td>
            <td style="padding:6px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.12em;" align="right">Total</td>
          </tr>
          <tr>
            <td style="padding:0 0 6px;font-size:14px;color:#0f172a;font-weight:800;">${escapeHtml(statusLabel)}</td>
            <td style="padding:0 0 6px;font-size:14px;color:#0f172a;font-weight:800;" align="right">${formatCurrency(order.totals?.total || 0)}</td>
          </tr>
        </table>
      </div>
      <div style="font-size:14px;line-height:1.75;color:#475569;">
        You can review your order any time in your account dashboard.
      </div>
    `,
  });

async function applyInventoryForOrder(items = []) {
  const adjustments = [];
  const lowStockItems = [];

  for (const item of items) {
    const quantity = Math.max(1, Number(item.quantity || 1));
    const product = await Product.findOneAndUpdate(
      { slug: item.slug, stockCount: { $gte: quantity } },
      { $inc: { stockCount: -quantity } },
      { new: true },
    );

    if (!product) {
      throw new Error(`Insufficient stock for ${item.name || item.slug}`);
    }

    const nextInStock = Number(product.stockCount || 0) > 0;
    const shouldLowStockNotify =
      Number(product.stockCount || 0) < LOW_STOCK_THRESHOLD &&
      !Boolean(product.lowStockNotified);

    await Product.findByIdAndUpdate(product._id, {
      $set: {
        inStock: nextInStock,
        ...(shouldLowStockNotify ? { lowStockNotified: true } : {}),
      },
    });

    adjustments.push({
      productId: String(product._id),
      quantity,
    });

    if (shouldLowStockNotify) {
      lowStockItems.push({
        name: String(product.name || item.name || item.slug || ""),
        quantity,
        stockCount: Number(product.stockCount || 0),
      });
    }
  }

  return { adjustments, lowStockItems };
}

async function rollbackInventoryAdjustments(adjustments = []) {
  for (const adjustment of [...adjustments].reverse()) {
    const product = await Product.findByIdAndUpdate(
      adjustment.productId,
      { $inc: { stockCount: Number(adjustment.quantity || 0) } },
      { new: true },
    );

    if (product) {
      const nextInStock = Number(product.stockCount || 0) > 0;
      const shouldResetLowStockNotified =
        Number(product.stockCount || 0) >= LOW_STOCK_THRESHOLD &&
        Boolean(product.lowStockNotified);

      await Product.findByIdAndUpdate(product._id, {
        $set: {
          inStock: nextInStock,
          ...(shouldResetLowStockNotified ? { lowStockNotified: false } : {}),
        },
      });
    }
  }
}

const normalizeOrder = (order) => ({
  _id: String(order._id),
  orderNumber: String(order.orderNumber || ""),
  user: order.user ? String(order.user) : null,
  customerName: String(order.customerName || ""),
  customerEmail: String(order.customerEmail || ""),
  customerPhone: String(order.customerPhone || ""),
  shippingAddress: {
    fullName: String(order.shippingAddress?.fullName || ""),
    email: String(order.shippingAddress?.email || ""),
    phone: String(order.shippingAddress?.phone || ""),
    address: String(order.shippingAddress?.address || ""),
    city: String(order.shippingAddress?.city || ""),
    postalCode: String(order.shippingAddress?.postalCode || ""),
  },
  items: Array.isArray(order.items)
    ? order.items.map((item) => ({
        ...normalizeCartItem(item),
        image: String(item.image || ""),
      }))
    : [],
  totals: {
    subtotal: Number(order.totals?.subtotal || 0),
    shipping: Number(order.totals?.shipping || 0),
    tax: Number(order.totals?.tax || 0),
    total: Number(order.totals?.total || 0),
  },
  delivery: String(order.delivery || "standard"),
  paymentMethod: String(order.paymentMethod || "card"),
  paymentProvider: String(order.paymentProvider || "manual"),
  paymentStatus: String(order.paymentStatus || "pending"),
  paymentReference: String(order.paymentReference || ""),
  status: mapPublicOrderStatus(order.status),
  statusHistory: Array.isArray(order.statusHistory)
    ? order.statusHistory.map((entry) => ({
        ...entry,
        status: mapPublicOrderStatus(entry?.status),
      }))
    : [],
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const normalizeOrderInput = (body) => ({
  items: Array.isArray(body.items) ? body.items.map(normalizeCartItem) : [],
  totals: {
    subtotal: Number(body.totals?.subtotal || 0),
    shipping: Number(body.totals?.shipping || 0),
    tax: Number(body.totals?.tax || 0),
    total: Number(body.totals?.total || 0),
  },
  shippingAddress: {
    fullName: String(body.shippingAddress?.fullName || "").trim(),
    email: String(body.shippingAddress?.email || "").trim().toLowerCase(),
    phone: String(body.shippingAddress?.phone || "").trim(),
    address: String(body.shippingAddress?.address || "").trim(),
    city: String(body.shippingAddress?.city || "").trim(),
    postalCode: String(body.shippingAddress?.postalCode || "").trim(),
  },
  delivery: String(body.delivery || "standard"),
  paymentMethod: String(body.paymentMethod || "card"),
  paymentProvider: String(body.paymentProvider || "manual"),
  paymentStatus: String(body.paymentStatus || "pending"),
  paymentReference: String(body.paymentReference || "").trim(),
});

const buildOrderNumber = () => {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `EC-${Date.now().toString().slice(-6)}-${suffix}`;
};

export async function createOrder({ body, user = null }) {
  await connectDB();
  const input = normalizeOrderInput(body);

  if (!input.items.length) {
    throw new Error("Order items are required");
  }

  if (!input.shippingAddress.fullName || !input.shippingAddress.email || !input.shippingAddress.address || !input.shippingAddress.city || !input.shippingAddress.postalCode) {
    throw new Error("Shipping address is required");
  }

  if (input.paymentReference) {
    const existingOrder = await Order.findOne({
      paymentReference: input.paymentReference,
      paymentProvider: input.paymentProvider,
    }).lean();

    if (existingOrder) {
      return normalizeOrder(existingOrder);
    }
  }

  const { adjustments, lowStockItems } = await applyInventoryForOrder(input.items);
  const shouldNotifyLowStock = lowStockItems.length > 0;
  const orderNumber = buildOrderNumber();
  let order;

  try {
    order = await Order.create({
      orderNumber,
      user: user?.id || null,
      customerName: input.shippingAddress.fullName,
      customerEmail: input.shippingAddress.email,
      customerPhone: input.shippingAddress.phone,
      shippingAddress: input.shippingAddress,
      items: input.items,
      totals: input.totals,
      delivery: input.delivery,
      paymentMethod: input.paymentMethod,
      paymentProvider: input.paymentProvider,
      paymentStatus: input.paymentStatus,
      paymentReference: input.paymentReference,
      status: input.paymentStatus === "paid" ? "processing" : "pending",
      statusHistory: [
        {
          status: "pending",
          note: "Order created",
          at: new Date(),
        },
        ...(input.paymentStatus === "paid"
          ? [
              {
                status: "processing",
                note: "Payment received",
                at: new Date(),
              },
            ]
          : []),
      ],
    });
  } catch (error) {
    await rollbackInventoryAdjustments(adjustments);
    throw error;
  }

  const logoAttachments = await getEmailLogoAttachment();
  const hasLogo = logoAttachments.length > 0;
  const adminReceiver = getAdminReceiver();
  // Ensure item images are present for email templates.
  const [orderForEmail] = await withItemImages([order.toObject()]);

  const emailTasks = [
    sendEmail({
      to: order.customerEmail,
      subject: `Order confirmed: ${orderNumber}`,
      html: buildStyledEmailShell({
        logo: hasLogo,
        eyebrow: "Order confirmed",
        title: `Invoice for order ${escapeHtml(orderNumber)}`,
        subtitle:
          "Your VAT invoice is attached as a PDF. Keep it for your records.",
        body: `
          <div style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#334155;">
            Order total: <strong style="color:#0f172a;">${formatCurrency(orderForEmail.totals?.total || 0)}</strong>
          </div>
        `,
      }),
      attachments: [
        ...logoAttachments,
        {
          filename: `invoice-${orderNumber}.pdf`,
          content: await renderVatInvoicePdfBuffer(orderForEmail),
          contentType: "application/pdf",
        },
      ],
    }),
  ];

  if (adminReceiver) {
    emailTasks.push(
      sendEmail({
        to: adminReceiver,
        subject: `Payment received for ${orderNumber}`,
        html: buildAdminPurchaseEmailHtml({ order: orderForEmail, logo: hasLogo }),
        attachments: logoAttachments,
      }),
    );

    if (shouldNotifyLowStock) {
      emailTasks.push(
        sendEmail({
          to: adminReceiver,
          subject: `Low stock alert for ${orderNumber}`,
          html: buildLowStockEmailHtml({
            order: orderForEmail,
            lowStockItems,
            logo: hasLogo,
          }),
          attachments: logoAttachments,
        }),
      );
    }
  }

  try {
    await Promise.allSettled(emailTasks);
  } catch {
    // Email failures should not block order creation in development.
  }

  const [withImages] = await withItemImages([order.toObject()]);
  return normalizeOrder(withImages);
}

export async function listOrdersForUser({ userId = null, email = null }) {
  await migrateLegacyDeliveredOrdersOnce();

  const query = [];
  if (userId) {
    query.push({ user: userId });
  }
  if (email) {
    query.push({ customerEmail: String(email).toLowerCase() });
  }

  const orders = await Order.find(query.length ? { $or: query } : {})
    .sort({ createdAt: -1 })
    .lean();

  const hydrated = await withItemImages(orders);
  return hydrated.map(normalizeOrder);
}

export async function listOrdersForAdmin() {
  await migrateLegacyDeliveredOrdersOnce();
  await connectDB();
  const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
  const hydrated = await withItemImages(orders);
  return hydrated.map(normalizeOrder);
}

export async function getOrderById(id) {
  await migrateLegacyDeliveredOrdersOnce();
  await connectDB();
  const order = await Order.findById(id).lean();
  if (!order) return null;
  const [hydrated] = await withItemImages([order]);
  return normalizeOrder(hydrated);
}

export async function updateOrderById(id, updates = {}) {
  await migrateLegacyDeliveredOrdersOnce();
  await connectDB();

  const order = await Order.findById(id);
  if (!order) {
    return null;
  }

  let shouldSendShippedEmail = false;
  let statusUpdateEmail = null;

  let nextStatus = null;
  if (typeof updates.status === "string" && updates.status.trim()) {
    let candidate = String(updates.status).toLowerCase().trim();
    if (candidate === "delivered") {
      candidate = "shipped";
    }
    const allowed = new Set(["pending", "processing", "shipped", "cancelled"]);
    if (!allowed.has(candidate)) {
      throw new Error("Invalid order status");
    }
    nextStatus = candidate;
  }

  if (nextStatus && nextStatus !== order.status) {
    const previousStatus = String(order.status || "").toLowerCase();
    order.status = nextStatus;
    order.statusHistory = Array.isArray(order.statusHistory)
      ? order.statusHistory
      : [];
    order.statusHistory.push({
      status: nextStatus,
      note: updates.note || `Order marked ${nextStatus}`,
      at: new Date(),
    });

    const wasTerminal =
      previousStatus === "shipped" || previousStatus === "delivered";
    shouldSendShippedEmail =
      nextStatus === "shipped" && !wasTerminal && Boolean(order.customerEmail);

    if (Boolean(order.customerEmail)) {
      if (nextStatus === "processing" && previousStatus === "pending") {
        statusUpdateEmail = {
          subject: `Your order is being prepared: ${order.orderNumber}`,
          statusLabel: "Processing",
          intro:
            "Good news — we’ve started preparing your order for shipment.",
        };
      }

      if (nextStatus === "cancelled" && previousStatus !== "cancelled") {
        statusUpdateEmail = {
          subject: `Order cancelled: ${order.orderNumber}`,
          statusLabel: "Cancelled",
          intro:
            "Your order has been cancelled. If you believe this is a mistake, reply to this email and we’ll help.",
        };
      }
    }
  }

  if (updates.paymentStatus && updates.paymentStatus !== order.paymentStatus) {
    order.paymentStatus = updates.paymentStatus;
  }

  if (typeof updates.paymentReference === "string") {
    order.paymentReference = updates.paymentReference.trim();
  }

  if (typeof updates.paymentMethod === "string") {
    order.paymentMethod = updates.paymentMethod;
  }

  if (typeof updates.paymentProvider === "string") {
    order.paymentProvider = updates.paymentProvider;
  }

  await order.save();

  if (shouldSendShippedEmail) {
    const logoAttachments = await getEmailLogoAttachment();
    const hasLogo = logoAttachments.length > 0;
    const [orderForEmail] = await withItemImages([order.toObject()]);

    try {
      await sendEmail({
        to: order.customerEmail,
        subject: `Your order has shipped: ${order.orderNumber}`,
        html: buildShippedEmailHtml({
          order: orderForEmail,
          logo: hasLogo,
        }),
        attachments: logoAttachments,
      });
    } catch (emailErr) {
      console.error("Shipped email error:", emailErr);
    }
  }

  if (statusUpdateEmail) {
    const logoAttachments = await getEmailLogoAttachment();
    const hasLogo = logoAttachments.length > 0;
    const [orderForEmail] = await withItemImages([order.toObject()]);

    try {
      await sendEmail({
        to: order.customerEmail,
        subject: statusUpdateEmail.subject,
        html: buildOrderUpdateEmailHtml({
          order: orderForEmail,
          logo: hasLogo,
          statusLabel: statusUpdateEmail.statusLabel,
          intro: statusUpdateEmail.intro,
        }),
        attachments: logoAttachments,
      });
    } catch (emailErr) {
      console.error("Order update email error:", emailErr);
    }
  }

  return normalizeOrder(order.toObject());
}

export async function deleteOrderById(id) {
  await connectDB();
  const deleted = await Order.findByIdAndDelete(id);
  return Boolean(deleted);
}

export async function countOrdersByUserIds(userIds = []) {
  await connectDB();
  const counts = await Order.aggregate([
    {
      $match: {
        user: {
          $in: userIds,
        },
      },
    },
    {
      $group: {
        _id: "$user",
        count: { $sum: 1 },
      },
    },
  ]);

  return counts.reduce((acc, item) => {
    acc[String(item._id)] = item.count;
    return acc;
  }, {});
}
