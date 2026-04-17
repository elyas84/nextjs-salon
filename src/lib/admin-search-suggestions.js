/**
 * Contextual admin toolbar autocomplete from already-loaded lists (no extra API).
 * @returns {Array<{ id: string, title: string, subtitle: string, queryText: string }>}
 */
export function computeAdminSearchSuggestions(
  section,
  rawQuery,
  data,
  options = {},
) {
  const q = String(rawQuery || "").trim().toLowerCase();
  if (!q) return [];

  const limit = Math.min(12, Math.max(4, Number(options.limit) || 8));
  const reviewStatusFilter = String(options.reviewStatusFilter || "all");

  const {
    products = [],
    orders = [],
    reviews = [],
    users = [],
    emails = [],
    bookings = [],
  } = data || {};

  const out = [];
  const seenApply = new Set();

  const add = (id, title, subtitle, queryText) => {
    if (out.length >= limit) return;
    const qt = String(queryText || "").trim();
    if (!qt) return;
    const key = `${section}:${qt.toLowerCase()}`;
    if (seenApply.has(key)) return;
    seenApply.add(key);
    out.push({
      id: String(id || qt),
      title: String(title || qt).trim() || qt,
      subtitle: String(subtitle || "").trim(),
      queryText: qt,
    });
  };

  switch (section) {
    case "inventory": {
      for (const p of products) {
        const hay = [
          p?.name,
          p?.slug,
          p?.category,
          p?._id,
          String(p?.price ?? ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) continue;
        const name = String(p?.name || "Product");
        const slug = String(p?.slug || "");
        let qt = name;
        if (!name.toLowerCase().includes(q) && slug.toLowerCase().includes(q)) {
          qt = slug;
        }
        add(p?._id || slug, name, [p?.category, slug].filter(Boolean).join(" · "), qt);
      }
      break;
    }
    case "orders":
    case "dashboard": {
      for (const o of orders) {
        const hay = [
          o?.orderNumber,
          o?._id,
          o?.customerName,
          o?.customerEmail,
          o?.status,
          o?.paymentStatus,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) continue;
        const num = String(o?.orderNumber || "");
        const email = String(o?.customerEmail || "");
        const nm = String(o?.customerName || "");
        let qt = num;
        if (num.toLowerCase().includes(q)) qt = num;
        else if (email.toLowerCase().includes(q)) qt = email;
        else if (nm.toLowerCase().includes(q)) qt = nm;
        else qt = num || email || nm;
        add(
          o?._id || num || email,
          num || "Order",
          [nm, email, o?.status].filter(Boolean).join(" · "),
          qt,
        );
      }
      break;
    }
    case "reviews": {
      let list = Array.isArray(reviews) ? reviews : [];
      if (reviewStatusFilter !== "all") {
        list = list.filter((r) => String(r?.status || "") === reviewStatusFilter);
      }
      for (const r of list) {
        const hay = [
          r?.productName,
          r?.productSlug,
          r?.userName,
          r?.userEmail,
          r?.comment,
          r?.status,
          String(r?.rating ?? ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) continue;
        const pn = String(r?.productName || "Review");
        const ue = String(r?.userEmail || "");
        let qt = pn;
        if (pn.toLowerCase().includes(q)) qt = pn;
        else if (ue.toLowerCase().includes(q)) qt = ue;
        else qt = String(r?.userName || pn);
        add(
          r?._id || `${pn}-${ue}`,
          pn,
          [r?.userName, ue, `★ ${r?.rating}`].filter(Boolean).join(" · "),
          qt,
        );
      }
      break;
    }
    case "users": {
      for (const u of users) {
        const hay = [u?.name, u?.email, u?.role, String(u?._id || "")]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) continue;
        const name = String(u?.name || "User");
        const email = String(u?.email || "");
        let qt = email || name;
        if (email.toLowerCase().includes(q)) qt = email;
        else if (name.toLowerCase().includes(q)) qt = name;
        else qt = String(u?.role || email || name);
        add(u?._id || email || name, name, [email, u?.role].filter(Boolean).join(" · "), qt);
      }
      break;
    }
    case "emails": {
      for (const e of emails) {
        const hay = [e?.name, e?.email, e?.company, e?.message, String(e?._id || "")]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) continue;
        const name = String(e?.name || "Message");
        const email = String(e?.email || "");
        let qt = email || name;
        if (email.toLowerCase().includes(q)) qt = email;
        else if (name.toLowerCase().includes(q)) qt = name;
        else qt = String(e?.company || email);
        add(e?._id || email, name, email, qt);
      }
      break;
    }
    case "bookings": {
      for (const b of bookings) {
        const hay = [
          b?.fullName,
          b?.email,
          b?.phone,
          b?.registrationNumber,
          b?.serviceType,
          b?.preferredDate,
          b?.preferredTime,
          b?.notes,
          b?.adminNotes,
          b?.status,
          String(b?._id || ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) continue;
        const nm = String(b?.fullName || "Booking");
        const email = String(b?.email || "");
        const reg = String(b?.registrationNumber || "");
        let qt = email || reg || nm;
        if (email.toLowerCase().includes(q)) qt = email;
        else if (reg.toLowerCase().includes(q)) qt = reg;
        else if (nm.toLowerCase().includes(q)) qt = nm;
        else qt = String(b?.serviceType || email);
        add(
          b?._id || email,
          nm,
          [b?.serviceType, reg].filter(Boolean).join(" · "),
          qt,
        );
      }
      break;
    }
    default:
      break;
  }

  return out;
}

export function adminSectionHasSearchAutocomplete(section) {
  return [
    "inventory",
    "orders",
    "dashboard",
    "reviews",
    "users",
    "emails",
    "bookings",
  ].includes(section);
}
