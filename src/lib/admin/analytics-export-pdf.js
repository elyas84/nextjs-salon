"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function safeNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function filterPaidOrders(orders) {
  return (Array.isArray(orders) ? orders : []).filter(
    (o) => String(o?.paymentStatus || "").toLowerCase() === "paid",
  );
}

function fmtCreated(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const TABLE_HEAD = [
  "Order #",
  "Created",
  "Customer",
  "Email",
  "Phone",
  "Status",
  "Pay status",
  "Provider",
  "Method",
  "Delivery",
  "Subtotal",
  "Ship",
  "Tax",
  "Total",
];

function orderRowsForTable(paidOrders, formatCurrency) {
  return paidOrders.map((o) => {
    const t = o?.totals || {};
    return [
      String(o?.orderNumber || "—"),
      fmtCreated(o?.createdAt),
      String(o?.customerName || "—").slice(0, 36),
      String(o?.customerEmail || "—").slice(0, 40),
      String(o?.customerPhone || "—").slice(0, 18),
      String(o?.status || "—"),
      String(o?.paymentStatus || "—"),
      String(o?.paymentProvider || "—").slice(0, 18),
      String(o?.paymentMethod || "—"),
      String(o?.delivery || "—"),
      formatCurrency(safeNum(t.subtotal)),
      formatCurrency(safeNum(t.shipping)),
      formatCurrency(safeNum(t.tax)),
      formatCurrency(safeNum(t.total)),
    ];
  });
}

const autoTableOpts = {
  styles: { fontSize: 6, cellPadding: 1.2 },
  headStyles: {
    fillColor: [39, 39, 42],
    textColor: [255, 255, 255],
    fontStyle: "bold",
  },
  alternateRowStyles: { fillColor: [248, 250, 252] },
  showHead: "everyPage",
  margin: { top: 10, right: 10, bottom: 12, left: 10 },
};

/**
 * @param {object} opts
 * @param {object[]} opts.paidOrders
 * @param {string} opts.periodLabel
 * @param {string} opts.analyticsRangeKey
 * @param {(n: number) => string} opts.formatCurrency
 */
export function downloadAnalyticsPdf({
  paidOrders,
  periodLabel,
  analyticsRangeKey,
  formatCurrency,
}) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  const stamp = new Date().toISOString().slice(0, 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 27);
  doc.text("FixPro — Analytics (paid orders)", 14, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(82, 82, 91);
  doc.text(`Period: ${periodLabel}`, 14, 23);
  doc.text(`Range: ${analyticsRangeKey}`, 14, 29);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);

  autoTable(doc, {
    ...autoTableOpts,
    startY: 40,
    head: [TABLE_HEAD],
    body: orderRowsForTable(paidOrders, formatCurrency),
  });

  doc.save(`fixpro-analytics-${analyticsRangeKey}-${stamp}.pdf`);
}

/**
 * @param {object} opts
 * @param {object[]} opts.paidOrders
 * @param {string} opts.periodLabel
 * @param {string} opts.analyticsRangeKey
 * @param {(n: number) => string} opts.formatCurrency
 * @param {object} opts.summary
 */
export function downloadReportPdf({
  paidOrders,
  periodLabel,
  analyticsRangeKey,
  formatCurrency,
  summary,
}) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  const stamp = new Date().toISOString().slice(0, 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 27);
  doc.text("FixPro — Admin report", 14, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let y = 24;
  const rows = [
    ["Generated", new Date().toLocaleString()],
    ["Analytics period", periodLabel],
    ["Range key", String(analyticsRangeKey)],
    ["Revenue (paid)", formatCurrency(summary.revenuePaid)],
    ["Paid orders", String(summary.paidOrdersCount)],
    ["Orders in period (all statuses)", String(summary.totalOrdersInPeriod)],
    ["Stripe revenue (paid)", formatCurrency(summary.stripeRev)],
    ["PayPal revenue (paid)", formatCurrency(summary.paypalRev)],
    ["Low stock SKUs (<5)", String(summary.lowStockSkus)],
    ["Pending reviews", String(summary.pendingReviewsCount)],
  ];

  for (const [label, val] of rows) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(24, 24, 27);
    doc.text(`${label}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(63, 63, 70);
    const lines = doc.splitTextToSize(String(val), 200);
    doc.text(lines, 72, y);
    y += Math.max(6, lines.length * 5);
  }

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text("Paid orders detail", 14, y);

  autoTable(doc, {
    ...autoTableOpts,
    startY: y + 4,
    head: [TABLE_HEAD],
    body: orderRowsForTable(paidOrders, formatCurrency),
  });

  doc.save(`fixpro-report-${analyticsRangeKey}-${stamp}.pdf`);
}
