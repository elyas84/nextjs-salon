"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BarChart3,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  DollarSign,
  Eye,
  ExternalLink,
  FileText,
  Mail,
  MailOpen,
  Package,
  EyeOff,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  PanelLeft,
  Phone,
  PlusCircle,
  Quote,
  Search,
  Settings,
  ShoppingCart,
  Boxes,
  Users,
  TrendingDown,
  TrendingUp,
  User,
  Trash2,
  PencilLine,
  Download,
  Tag,
  Star,
  UserCircle,
  X,
} from "lucide-react";
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import toast from "react-hot-toast";
import { bookingRefCode } from "@/lib/booking-ref";
import { formatSlotLabel, slotsForIsoDateLocal } from "@/lib/booking-slots";
import {
  adminSectionHasSearchAutocomplete,
  computeAdminSearchSuggestions,
} from "@/lib/admin-search-suggestions";
import { formatUserActivityAgo } from "@/lib/format-last-login";
import {
  downloadAnalyticsPdf,
  downloadReportPdf,
  filterPaidOrders,
} from "@/lib/admin/analytics-export-pdf";
import SiteSettingsPanel from "@/components/admin/site-settings-panel";
import TestimonialsAdminPanel from "@/components/admin/testimonials-admin-panel";
import { formatCurrency } from "@/lib/store/cart";
import {
  BOOKING_REFERENCE_MAX_LEN,
  normalizeBookingReference,
} from "@/lib/booking-reference";
import { PRODUCT_CATEGORY_OPTIONS } from "@/lib/product-categories";
import {
  authInputClass,
  authPrimaryButtonClass,
  storePanelClass,
  storeSecondaryButtonClass,
} from "@/lib/auth-page-styles";

const SECTIONS = [
  "dashboard",
  "inventory",
  "bookings",
  "orders",
  "reviews",
  "testimonials",
  "analytics",
  "users",
  "emails",
  "settings",
  "profile",
];

ChartJS.register(ArcElement, Tooltip, Legend);
const CATEGORY_OPTIONS = PRODUCT_CATEGORY_OPTIONS;
const BADGE_OPTIONS = ["New", "Sale"];

/** Single source for admin nav — desktop sidebar + mobile drawer. */
const ADMIN_NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "inventory", label: "Inventory Management", icon: Boxes },
  { key: "bookings", label: "Service Bookings", icon: CalendarDays },
  { key: "orders", label: "Customer Orders", icon: ShoppingCart },
  { key: "reviews", label: "Product Reviews", icon: MessageSquare },
  { key: "testimonials", label: "Testimonials", icon: Quote },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "users", label: "Users", icon: Users },
  { key: "emails", label: "Emails", icon: Mail },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "profile", label: "Profile", icon: UserCircle },
];

function adminSectionLabel(key) {
  const found = ADMIN_NAV_ITEMS.find((x) => x.key === key);
  if (found) return found.label;
  return String(key || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const USERS_PER_PAGE = 8;
const BOOKINGS_PER_PAGE = 4;
const INVENTORY_PER_PAGE = 10;
const ORDERS_PER_PAGE = 3;

function safeNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function paymentProviderBucket(o) {
  const p = String(o?.paymentProvider || "").toLowerCase();
  if (p.includes("stripe")) return "stripe";
  if (p.includes("paypal")) return "paypal";
  return "other";
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatFulfillmentLabel(status) {
  const s = String(status || "").toLowerCase();
  if (!s) return "—";
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function userAvatarLetter(u) {
  const raw = String(u?.name || u?.email || "?").trim();
  const first = raw.split(/\s+/).filter(Boolean)[0] || raw;
  const ch = first.charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

function recentOrderLabel(status) {
  const s = String(status || "").trim();
  if (!s) return "None";
  return s.toLowerCase();
}

function accountCreatedUsShort(createdAt) {
  if (!createdAt) return "—";
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "—";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function readSeenTimestamp(key) {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeSeenTimestamp(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(Number(value) || 0));
  } catch {
    // ignore
  }
}

export default function AdminPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const adminSearchWrapRef = useRef(null);
  const adminSearchInputRef = useRef(null);
  const adminSearchListId = useId();
  const [adminSearchHighlight, setAdminSearchHighlight] = useState(-1);
  const [adminSuggestSuppressed, setAdminSuggestSuppressed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [mobileNavMounted, setMobileNavMounted] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [emails, setEmails] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profilePasswordVisible, setProfilePasswordVisible] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [emailPendingDelete, setEmailPendingDelete] = useState(null);
  const [emailDeleteLoading, setEmailDeleteLoading] = useState(false);
  const [emailMarkingReadId, setEmailMarkingReadId] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [lastSeenOrdersAt, setLastSeenOrdersAt] = useState(0);
  const [lastSeenReviewsAt, setLastSeenReviewsAt] = useState(0);
  const [lastSeenBookingsAt, setLastSeenBookingsAt] = useState(0);
  const [reviewStatusFilter, setReviewStatusFilter] = useState("all"); // all | pending | approved | rejected
  const [customerOrdersUser, setCustomerOrdersUser] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const [userPendingDelete, setUserPendingDelete] = useState(null);
  const [userDeleteLoading, setUserDeleteLoading] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [reviewPendingDelete, setReviewPendingDelete] = useState(null);
  const [reviewDeleteLoading, setReviewDeleteLoading] = useState(false);
  const [bookingUpdatingId, setBookingUpdatingId] = useState(null);
  const [bookingModal, setBookingModal] = useState(null);
  const [bookingModalSaving, setBookingModalSaving] = useState(false);
  const [bookingPendingDelete, setBookingPendingDelete] = useState(null);
  const [bookingDeleteLoading, setBookingDeleteLoading] = useState(false);
  const [productPendingDelete, setProductPendingDelete] = useState(null);
  const [productDeleteLoading, setProductDeleteLoading] = useState(false);
  const [orderPendingDelete, setOrderPendingDelete] = useState(null);
  const [orderDeleteLoading, setOrderDeleteLoading] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState("create"); // create | edit | view
  const [productModalSaving, setProductModalSaving] = useState(false);
  const [productModalProduct, setProductModalProduct] = useState(null);

  const openMobileNav = useCallback(() => {
    setMobileNavMounted(true);
    window.requestAnimationFrame(() => setMobileNavOpen(true));
  }, []);

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
    window.setTimeout(() => setMobileNavMounted(false), 260);
  }, []);

  useEffect(() => {
    if (!mobileNavMounted) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeMobileNav();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavMounted, closeMobileNav]);
  const [productForm, setProductForm] = useState({
    name: "",
    slug: "",
    category: CATEGORY_OPTIONS[0],
    price: "",
    compareAtPrice: "",
    stockCount: "",
    inStock: true,
    badge: "",
    description: "",
    gallery: [],
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = res.ok ? await res.json() : null;

        if (cancelled) return;

        if (!res.ok) {
          router.replace("/login");
          return;
        }

        if (data?.user?.role !== "superadmin") {
          router.replace("/dashboard");
          return;
        }

        setAdminUser(data.user);
        setDataLoading(true);
        const [pRes, oRes, uRes, revRes, bookRes, mailRes] = await Promise.all([
          fetch("/api/products", { credentials: "include" }),
          fetch("/api/orders", { credentials: "include" }),
          fetch("/api/users", { credentials: "include" }),
          fetch("/api/reviews?status=all", { credentials: "include" }),
          fetch("/api/bookings", { credentials: "include" }),
          fetch("/api/emails", { credentials: "include" }),
        ]);

        const pData = pRes.ok ? await pRes.json() : { products: [] };
        const oData = oRes.ok ? await oRes.json() : { orders: [] };
        const uData = uRes.ok ? await uRes.json() : { users: [] };
        const revData = revRes.ok ? await revRes.json() : { reviews: [] };
        const bookData = bookRes.ok ? await bookRes.json() : { bookings: [] };
        const mailData = mailRes.ok ? await mailRes.json() : { emails: [] };

        if (cancelled) return;
        setProducts(Array.isArray(pData.products) ? pData.products : []);
        setOrders(Array.isArray(oData.orders) ? oData.orders : []);
        setUsers(Array.isArray(uData.users) ? uData.users : []);
        setReviews(Array.isArray(revData.reviews) ? revData.reviews : []);
        setBookings(Array.isArray(bookData.bookings) ? bookData.bookings : []);
        setEmails(Array.isArray(mailData.emails) ? mailData.emails : []);
      } catch {
        if (!cancelled) router.replace("/login");
      } finally {
        if (!cancelled) {
          setDataLoading(false);
          setChecking(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    setLastSeenOrdersAt(readSeenTimestamp("ecom:admin:lastSeenOrdersAt"));
    setLastSeenReviewsAt(readSeenTimestamp("ecom:admin:lastSeenReviewsAt"));
    setLastSeenBookingsAt(readSeenTimestamp("ecom:admin:lastSeenBookingsAt"));
  }, []);

  useEffect(() => {
    if (!adminUser) return;
    setProfileName(String(adminUser.name || ""));
    setProfileEmail(String(adminUser.email || ""));
  }, [adminUser]);

  const latestOrderEventAt = useMemo(() => {
    return orders.reduce((maxValue, order) => {
      const createdAt = new Date(order?.createdAt || 0).getTime() || 0;
      const updatedAt = new Date(order?.updatedAt || 0).getTime() || 0;
      const history =
        Array.isArray(order?.statusHistory) && order.statusHistory.length
          ? order.statusHistory
          : [];
      const lastHistory = history.length ? history[history.length - 1] : null;
      const historyAt = new Date(
        lastHistory?.createdAt || lastHistory?.updatedAt || 0,
      ).getTime();
      const eventAt = Math.max(createdAt, updatedAt, historyAt || 0);
      return Math.max(maxValue, eventAt);
    }, 0);
  }, [orders]);

  const latestReviewEventAt = useMemo(() => {
    return reviews.reduce((maxValue, review) => {
      const createdAt = new Date(review?.createdAt || 0).getTime() || 0;
      const updatedAt = new Date(review?.updatedAt || 0).getTime() || 0;
      return Math.max(maxValue, createdAt, updatedAt);
    }, 0);
  }, [reviews]);

  const latestBookingEventAt = useMemo(() => {
    return bookings.reduce((maxValue, b) => {
      const createdAt = new Date(b?.createdAt || 0).getTime() || 0;
      const updatedAt = new Date(b?.updatedAt || 0).getTime() || 0;
      return Math.max(maxValue, createdAt, updatedAt);
    }, 0);
  }, [bookings]);

  const adminOrderUpdatesCount = useMemo(() => {
    return orders.reduce((count, order) => {
      const createdAt = new Date(order?.createdAt || 0).getTime() || 0;
      const updatedAt = new Date(order?.updatedAt || 0).getTime() || 0;
      const history =
        Array.isArray(order?.statusHistory) && order.statusHistory.length
          ? order.statusHistory
          : [];
      const lastHistory = history.length ? history[history.length - 1] : null;
      const historyAt = new Date(
        lastHistory?.createdAt || lastHistory?.updatedAt || 0,
      ).getTime();
      const eventAt = Math.max(createdAt, updatedAt, historyAt || 0);
      if (eventAt <= lastSeenOrdersAt) return count;
      return count + 1;
    }, 0);
  }, [orders, lastSeenOrdersAt]);

  const adminReviewActivityCount = useMemo(() => {
    return reviews.reduce((count, review) => {
      const createdAt = new Date(review?.createdAt || 0).getTime() || 0;
      const updatedAt = new Date(review?.updatedAt || 0).getTime() || 0;
      const eventAt = Math.max(createdAt, updatedAt);
      if (eventAt <= lastSeenReviewsAt) return count;
      return count + 1;
    }, 0);
  }, [reviews, lastSeenReviewsAt]);

  const adminBookingNewCount = useMemo(() => {
    return bookings.reduce((count, b) => {
      const createdAt = new Date(b?.createdAt || 0).getTime() || 0;
      if (createdAt <= lastSeenBookingsAt) return count;
      return count + 1;
    }, 0);
  }, [bookings, lastSeenBookingsAt]);

  useEffect(() => {
    if (activeSection !== "orders") return;
    const nextSeen = Math.max(Date.now(), latestOrderEventAt || 0);
    setLastSeenOrdersAt(nextSeen);
    writeSeenTimestamp("ecom:admin:lastSeenOrdersAt", nextSeen);
  }, [activeSection, latestOrderEventAt]);

  useEffect(() => {
    if (activeSection !== "reviews") return;
    const nextSeen = Math.max(Date.now(), latestReviewEventAt || 0);
    setLastSeenReviewsAt(nextSeen);
    writeSeenTimestamp("ecom:admin:lastSeenReviewsAt", nextSeen);
  }, [activeSection, latestReviewEventAt]);

  useEffect(() => {
    if (activeSection !== "bookings") return;
    const nextSeen = Math.max(Date.now(), latestBookingEventAt || 0);
    setLastSeenBookingsAt(nextSeen);
    writeSeenTimestamp("ecom:admin:lastSeenBookingsAt", nextSeen);
  }, [activeSection, latestBookingEventAt]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
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
      return hay.includes(q);
    });
  }, [products, query]);

  const inventoryTotalPages = useMemo(() => {
    return Math.max(
      1,
      Math.ceil(filteredProducts.length / INVENTORY_PER_PAGE),
    );
  }, [filteredProducts.length]);

  useEffect(() => {
    setInventoryPage(1);
  }, [query]);

  useEffect(() => {
    setInventoryPage((p) => Math.min(Math.max(1, p), inventoryTotalPages));
  }, [inventoryTotalPages]);

  const pagedProducts = useMemo(() => {
    const start = (inventoryPage - 1) * INVENTORY_PER_PAGE;
    return filteredProducts.slice(start, start + INVENTORY_PER_PAGE);
  }, [filteredProducts, inventoryPage]);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
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
      return hay.includes(q);
    });
  }, [orders, query]);

  const ordersTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  }, [filteredOrders.length]);

  useEffect(() => {
    setOrderPage(1);
  }, [query]);

  useEffect(() => {
    setOrderPage((p) => Math.min(Math.max(1, p), ordersTotalPages));
  }, [ordersTotalPages]);

  const pagedOrders = useMemo(() => {
    const start = (orderPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, orderPage]);

  const filteredReviews = useMemo(() => {
    let list = Array.isArray(reviews) ? reviews : [];
    if (reviewStatusFilter !== "all") {
      list = list.filter((r) => String(r?.status || "") === reviewStatusFilter);
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
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
      return hay.includes(q);
    });
  }, [reviews, query, reviewStatusFilter]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(users) ? users : [];
    if (!q) return list;
    return list.filter((u) => {
      const hay = [u?.name, u?.email, u?.role, String(u?._id || "")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [users, query]);

  const customerUserOrders = useMemo(() => {
    if (!customerOrdersUser) return [];
    const uid = String(customerOrdersUser._id || "");
    const email = String(customerOrdersUser.email || "")
      .trim()
      .toLowerCase();
    return orders
      .filter((o) => {
        if (uid && o?.user && String(o.user) === uid) return true;
        if (
          email &&
          o?.customerEmail &&
          String(o.customerEmail).toLowerCase() === email
        ) {
          return true;
        }
        return false;
      })
      .sort((a, b) => {
        const ta = new Date(a?.createdAt || 0).getTime();
        const tb = new Date(b?.createdAt || 0).getTime();
        return tb - ta;
      });
  }, [orders, customerOrdersUser]);

  const filteredEmails = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(emails) ? emails : [];
    if (!q) return list;
    return list.filter((e) => {
      const hay = [
        e?.name,
        e?.email,
        e?.company,
        e?.phone,
        e?.topic,
        e?.message,
        String(e?._id || ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [emails, query]);

  const filteredBookings = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(bookings) ? bookings : [];
    if (!q) return list;
    return list.filter((b) => {
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
      return hay.includes(q);
    });
  }, [bookings, query]);

  const bookingsTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE));
  }, [filteredBookings.length]);

  useEffect(() => {
    setBookingPage(1);
  }, [query]);

  useEffect(() => {
    setBookingPage((p) => Math.min(Math.max(1, p), bookingsTotalPages));
  }, [bookingsTotalPages]);

  const pagedBookings = useMemo(() => {
    const start = (bookingPage - 1) * BOOKINGS_PER_PAGE;
    return filteredBookings.slice(start, start + BOOKINGS_PER_PAGE);
  }, [filteredBookings, bookingPage]);

  const adminSearchSuggestions = useMemo(
    () =>
      computeAdminSearchSuggestions(
        activeSection,
        query,
        {
          products,
          orders,
          reviews,
          users,
          emails,
          bookings,
        },
        { reviewStatusFilter },
      ),
    [
      activeSection,
      query,
      products,
      orders,
      reviews,
      users,
      emails,
      bookings,
      reviewStatusFilter,
    ],
  );

  const trimmedAdminQuery = query.trim();
  const adminSearchPanelOpen =
    adminSectionHasSearchAutocomplete(activeSection) &&
    trimmedAdminQuery.length > 0 &&
    !adminSuggestSuppressed &&
    adminSearchSuggestions.length > 0;

  useEffect(() => {
    setAdminSearchHighlight((i) =>
      i >= 0 && i >= adminSearchSuggestions.length ? -1 : i,
    );
  }, [adminSearchSuggestions.length]);

  const adminEmailUnreadCount = useMemo(() => {
    return emails.filter((e) => !e.isRead).length;
  }, [emails]);

  const reviewsPerPage = 5;
  const reviewsTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredReviews.length / reviewsPerPage));
  }, [filteredReviews.length]);

  useEffect(() => {
    setReviewPage(1);
  }, [reviewStatusFilter, query]);

  useEffect(() => {
    setReviewPage((p) => Math.min(Math.max(1, p), reviewsTotalPages));
  }, [reviewsTotalPages]);

  const pagedReviews = useMemo(() => {
    const start = (reviewPage - 1) * reviewsPerPage;
    return filteredReviews.slice(start, start + reviewsPerPage);
  }, [filteredReviews, reviewPage]);

  const usersTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  }, [filteredUsers.length]);

  useEffect(() => {
    setUserPage(1);
  }, [query]);

  useEffect(() => {
    setAdminSearchHighlight(-1);
  }, [query, activeSection]);

  useEffect(() => {
    setAdminSuggestSuppressed(false);
  }, [query]);

  useEffect(() => {
    if (!adminSearchPanelOpen) return undefined;
    const onPointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (adminSearchWrapRef.current?.contains(target)) return;
      setAdminSuggestSuppressed(true);
      setAdminSearchHighlight(-1);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [adminSearchPanelOpen]);

  useEffect(() => {
    setUserPage((p) => Math.min(Math.max(1, p), usersTotalPages));
  }, [usersTotalPages]);

  const pagedUsers = useMemo(() => {
    const start = (userPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, userPage]);

  const analytics = useMemo(() => {
    const paidOrders = orders.filter((o) => String(o?.paymentStatus) === "paid");
    const revenue = paidOrders.reduce(
      (acc, o) => acc + safeNum(o?.totals?.total),
      0,
    );
    const lowStock = products.filter((p) => safeNum(p?.stockCount) < 5).length;
    const pendingOrders = orders.filter((o) => String(o?.status) === "pending")
      .length;
    const activeCustomers = users.length;
    const pendingReviewsCount = reviews.filter(
      (r) => String(r?.status) === "pending",
    ).length;

    return {
      revenue,
      paidOrdersCount: paidOrders.length,
      lowStock,
      pendingOrders,
      activeCustomers,
      pendingReviewsCount,
    };
  }, [orders, products, users, reviews]);

  const [analyticsRange, setAnalyticsRange] = useState("30d"); // 7d | 30d | 90d | all

  const analyticsWindow = useMemo(() => {
    const now = Date.now();
    const days =
      analyticsRange === "7d"
        ? 7
        : analyticsRange === "30d"
          ? 30
          : analyticsRange === "90d"
            ? 90
            : null;
    if (!days) {
      return {
        label: "All time",
        current: { startMs: 0, endMs: now },
        previous: null,
      };
    }
    const ms = days * 24 * 60 * 60 * 1000;
    return {
      label: `Last ${days} days`,
      current: { startMs: now - ms, endMs: now },
      previous: { startMs: now - 2 * ms, endMs: now - ms },
    };
  }, [analyticsRange]);

  const filteredOrdersForWindow = useMemo(() => {
    const { startMs, endMs } = analyticsWindow.current;
    return orders.filter((o) => {
      const t = new Date(o?.createdAt || 0).getTime() || 0;
      return t >= startMs && t <= endMs;
    });
  }, [orders, analyticsWindow]);

  const prevOrdersForWindow = useMemo(() => {
    const prev = analyticsWindow.previous;
    if (!prev) return [];
    return orders.filter((o) => {
      const t = new Date(o?.createdAt || 0).getTime() || 0;
      return t >= prev.startMs && t <= prev.endMs;
    });
  }, [orders, analyticsWindow]);

  const analyticsScoped = useMemo(() => {
    const paidOrders = filteredOrdersForWindow.filter(
      (o) => String(o?.paymentStatus) === "paid",
    );
    const revenue = paidOrders.reduce(
      (acc, o) => acc + safeNum(o?.totals?.total),
      0,
    );
    return {
      revenue,
      paidOrdersCount: paidOrders.length,
      totalOrdersCount: filteredOrdersForWindow.length,
    };
  }, [filteredOrdersForWindow]);

  const analyticsScopedPrev = useMemo(() => {
    const paidOrders = prevOrdersForWindow.filter(
      (o) => String(o?.paymentStatus) === "paid",
    );
    const revenue = paidOrders.reduce(
      (acc, o) => acc + safeNum(o?.totals?.total),
      0,
    );
    return {
      revenue,
      paidOrdersCount: paidOrders.length,
      totalOrdersCount: prevOrdersForWindow.length,
    };
  }, [prevOrdersForWindow]);

  const pctDelta = useCallback((current, previous) => {
    const c = Number(current || 0);
    const p = Number(previous || 0);
    if (!Number.isFinite(c) || !Number.isFinite(p)) return null;
    if (p === 0) return c === 0 ? 0 : null;
    return ((c - p) / p) * 100;
  }, []);

  const analyticsKpis = useMemo(() => {
    const revenueDelta = pctDelta(analyticsScoped.revenue, analyticsScopedPrev.revenue);
    const ordersDelta = pctDelta(
      analyticsScoped.totalOrdersCount,
      analyticsScopedPrev.totalOrdersCount,
    );
    return [
      {
        label: "Revenue",
        value: formatCurrency(analyticsScoped.revenue),
        note: `${analyticsScoped.paidOrdersCount} paid orders`,
        delta: revenueDelta,
        icon: TrendingUp,
        accent: "border-amber-500",
        tone: "text-sky-300",
      },
      {
        label: "Orders",
        value: String(analyticsScoped.totalOrdersCount),
        note: analyticsWindow.previous ? "vs previous period" : "All-time window",
        delta: ordersDelta,
        icon: ShoppingCart,
        accent: "border-sky-400",
        tone: "text-zinc-300",
      },
      {
        label: "Low Stock Alerts",
        value: String(analytics.lowStock),
        note: "Stock count < 5",
        delta: null,
        icon: Boxes,
        accent: "border-red-400",
        tone: "text-red-300",
      },
      {
        label: "Pending Reviews",
        value: String(analytics.pendingReviewsCount),
        note: "Awaiting moderation",
        delta: null,
        icon: MessageSquare,
        accent: "border-zinc-400",
        tone: "text-sky-300",
      },
    ];
  }, [
    analytics.lowStock,
    analytics.pendingReviewsCount,
    analyticsScoped,
    analyticsScopedPrev,
    analyticsWindow.previous,
    pctDelta,
  ]);

  const handleDownloadAnalyticsPdf = useCallback(() => {
    const paid = filterPaidOrders(filteredOrdersForWindow);
    if (!paid.length) {
      toast.error("No paid orders in the selected analytics period.");
      return;
    }
    downloadAnalyticsPdf({
      paidOrders: paid,
      periodLabel: analyticsWindow.label,
      analyticsRangeKey: analyticsRange,
      formatCurrency,
    });
    toast.success("Analytics PDF downloaded.");
  }, [filteredOrdersForWindow, analyticsRange, analyticsWindow.label]);

  const handleExportReportPdf = useCallback(() => {
    const paid = filterPaidOrders(filteredOrdersForWindow);

    let stripeRev = 0;
    let paypalRev = 0;
    for (const o of paid) {
      const b = paymentProviderBucket(o);
      const total = safeNum(o?.totals?.total);
      if (b === "stripe") stripeRev += total;
      else if (b === "paypal") paypalRev += total;
    }

    downloadReportPdf({
      paidOrders: paid,
      periodLabel: analyticsWindow.label,
      analyticsRangeKey: analyticsRange,
      formatCurrency,
      summary: {
        revenuePaid: analyticsScoped.revenue,
        paidOrdersCount: analyticsScoped.paidOrdersCount,
        totalOrdersInPeriod: analyticsScoped.totalOrdersCount,
        stripeRev,
        paypalRev,
        lowStockSkus: analytics.lowStock,
        pendingReviewsCount: analytics.pendingReviewsCount,
      },
    });
    toast.success(
      paid.length
        ? "Report PDF downloaded."
        : "Report PDF downloaded (summary only — no paid orders in period).",
    );
  }, [
    analytics.lowStock,
    analytics.pendingReviewsCount,
    analyticsRange,
    analyticsScoped,
    analyticsWindow.label,
    filteredOrdersForWindow,
  ]);

  const kpis = useMemo(
    () => [
      {
        label: "Total Revenue",
        value: formatCurrency(analytics.revenue),
        note: `${analytics.paidOrdersCount} paid orders`,
        icon: TrendingUp,
        accent: "border-amber-500",
        tone: "text-sky-300",
      },
      {
        label: "Pending Reviews",
        value: String(analytics.pendingReviewsCount),
        note: "Awaiting moderation",
        icon: MessageSquare,
        accent: "border-sky-400",
        tone: "text-zinc-300",
      },
      {
        label: "Low Stock Alerts",
        value: String(analytics.lowStock),
        note: "Stock count ≤ 5",
        icon: Boxes,
        accent: "border-red-400",
        tone: "text-red-300",
      },
      {
        label: "Active Customers",
        value: String(analytics.activeCustomers),
        note: "Registered users",
        icon: Users,
        accent: "border-zinc-400",
        tone: "text-sky-300",
      },
    ],
    [analytics],
  );

  const confirmDeleteProduct = async () => {
    const id = productPendingDelete?._id;
    if (!id) return;
    setProductDeleteLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Failed to delete product.");
        return;
      }

      setProducts((prev) => prev.filter((p) => String(p?._id) !== String(id)));
      toast.success(data.message || "Product deleted.");
      setProductPendingDelete(null);
    } catch {
      toast.error("Failed to delete product.");
    } finally {
      setProductDeleteLoading(false);
    }
  };

  const toggleInStock = async (product) => {
    const id = product?._id;
    if (!id) return;
    const next = !Boolean(product?.inStock);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inStock: next }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Failed to update product.");
        return;
      }

      setProducts((prev) =>
        prev.map((p) => (String(p?._id) === String(id) ? data.product : p)),
      );
      toast.success(next ? "Marked in stock." : "Marked out of stock.");
    } catch {
      toast.error("Failed to update product.");
    }
  };

  const openCreateProduct = () => {
    setProductModalMode("create");
    setProductModalProduct(null);
    setProductForm({
      name: "",
      slug: "",
      category: CATEGORY_OPTIONS[0],
      price: "",
      compareAtPrice: "",
      stockCount: "",
      inStock: true,
      badge: "",
      description: "",
      gallery: [],
    });
    setProductModalOpen(true);
  };

  const openViewProduct = (product) => {
    const slug = String(product?.slug || "").trim();
    if (!slug) {
      toast.error("Missing product slug.");
      return;
    }
    router.push(`/products/${slug}`);
  };

  const openEditProduct = (product) => {
    const p = product || null;
    if (!p) return;
    setProductModalMode("edit");
    setProductModalProduct(p);
    setProductForm({
      name: String(p?.name || ""),
      slug: String(p?.slug || ""),
      category:
        String(p?.category || "").trim() || CATEGORY_OPTIONS[0],
      price: String(p?.price ?? ""),
      compareAtPrice:
        p?.compareAtPrice != null && Number(p.compareAtPrice) > 0
          ? String(p.compareAtPrice)
          : "",
      stockCount: String(p?.stockCount ?? ""),
      inStock: Boolean(p?.inStock),
      badge: (() => {
        const b = String(p?.badge || "").trim();
        if (b === "Discount") return "Sale";
        return BADGE_OPTIONS.includes(b) ? b : "";
      })(),
      description: String(p?.description || p?.shortDescription || ""),
      gallery: Array.isArray(p?.gallery) ? p.gallery.filter(Boolean) : [],
    });
    setProductModalOpen(true);
  };

  const saveProduct = async () => {
    if (productModalSaving) return;
    const name = String(productForm.name || "").trim();
    const slug = String(productForm.slug || "").trim();
    const category = String(productForm.category || "").trim();
    const price = Number(productForm.price);

    if (!name || !slug || !category || !Number.isFinite(price)) {
      toast.error("Name, slug, category, and price are required.");
      return;
    }

    const rawCompare = String(productForm.compareAtPrice ?? "").trim();
    const compareAtPrice =
      rawCompare === "" ? 0 : Number(rawCompare.replace(/,/g, ""));
    if (rawCompare !== "" && !Number.isFinite(compareAtPrice)) {
      toast.error("Compare-at price must be a valid number.");
      return;
    }
    if (compareAtPrice > 0 && compareAtPrice <= price) {
      toast.error("Original price must be greater than the current price to show savings.");
      return;
    }

    const payload = {
      name,
      slug,
      category,
      price,
      compareAtPrice,
      stockCount: Number(productForm.stockCount || 0),
      inStock: Boolean(productForm.inStock),
      badge: String(productForm.badge || "").trim(),
      description: String(productForm.description || "").trim(),
      gallery: Array.isArray(productForm.gallery)
        ? productForm.gallery.map((u) => String(u || "").trim()).filter(Boolean)
        : [],
    };

    setProductModalSaving(true);
    try {
      const isEdit = productModalMode === "edit";
      const id = productModalProduct?._id;
      const res = await fetch(isEdit ? `/api/products/${id}` : "/api/products", {
        method: isEdit ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to save product.");
        return;
      }

      const saved = data.product;
      setProducts((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        if (!saved?._id) return list;
        const idx = list.findIndex((p) => String(p?._id) === String(saved._id));
        if (idx >= 0) {
          const next = [...list];
          next[idx] = saved;
          return next;
        }
        return [saved, ...list];
      });
      toast.success(isEdit ? "Product updated." : "Product created.");
      setProductModalOpen(false);
    } catch {
      toast.error("Failed to save product.");
    } finally {
      setProductModalSaving(false);
    }
  };

  const updateOrderStatus = async (orderId, patch) => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to update order.");
        return;
      }
      setOrders((prev) =>
        prev.map((o) => (String(o?._id) === String(orderId) ? data.order : o)),
      );
      toast.success("Order updated.");
    } catch {
      toast.error("Failed to update order.");
    }
  };

  const confirmDeleteOrder = async () => {
    if (!orderPendingDelete?._id) return;
    setOrderDeleteLoading(true);
    try {
      const id = String(orderPendingDelete._id);
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to delete order.");
        return;
      }
      setOrders((prev) => prev.filter((o) => String(o?._id) !== id));
      setOrderPendingDelete(null);
      const uRes = await fetch("/api/users", { credentials: "include" });
      if (uRes.ok) {
        const uData = await uRes.json();
        const list = Array.isArray(uData.users) ? uData.users : [];
        setUsers(list);
        if (customerOrdersUser) {
          const fresh = list.find(
            (u) => String(u?._id) === String(customerOrdersUser._id),
          );
          if (fresh) setCustomerOrdersUser(fresh);
        }
      }
      toast.success(data.message || "Order deleted.");
    } catch {
      toast.error("Failed to delete order.");
    } finally {
      setOrderDeleteLoading(false);
    }
  };

  const patchBookingStatus = async (bookingId, status) => {
    if (!bookingId) return;
    setBookingUpdatingId(String(bookingId));
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to update booking.");
        return;
      }
      if (data.booking) {
        setBookings((prev) =>
          prev.map((b) =>
            String(b?._id) === String(bookingId) ? data.booking : b,
          ),
        );
      }
      toast.success("Booking updated.");
    } catch {
      toast.error("Failed to update booking.");
    } finally {
      setBookingUpdatingId(null);
    }
  };

  const emptyBookingDraft = () => ({
    fullName: "",
    email: "",
    phone: "",
    registrationNumber: "",
    serviceType: "Haircut & finish",
    preferredDate: "",
    preferredTime: "",
    notes: "",
    adminNotes: "",
    status: "confirmed",
  });

  const bookingToDraft = (b) => ({
    _id: String(b._id),
    fullName: String(b.fullName || ""),
    email: String(b.email || ""),
    phone: String(b.phone || ""),
    registrationNumber: String(b.registrationNumber || "").trim(),
    serviceType: String(b.serviceType || "Haircut & finish"),
    preferredDate: String(b.preferredDate || ""),
    preferredTime: String(b.preferredTime || ""),
    notes: String(b.notes || ""),
    adminNotes: String(b.adminNotes || ""),
    status: String(b.status || "pending"),
  });

  useEffect(() => {
    if (!bookingModal) return;
    const date = bookingModal.draft.preferredDate;
    const opts = slotsForIsoDateLocal(date);
    setBookingModal((m) => {
      if (!m) return m;
      if (!opts.length) {
        return m.draft.preferredTime
          ? { ...m, draft: { ...m.draft, preferredTime: "" } }
          : m;
      }
      if (opts.includes(m.draft.preferredTime)) return m;
      return { ...m, draft: { ...m.draft, preferredTime: opts[0] } };
    });
  }, [bookingModal?.draft?.preferredDate]);

  const updateBookingDraft = (field, value) => {
    setBookingModal((m) =>
      m ? { ...m, draft: { ...m.draft, [field]: value } } : m,
    );
  };

  const saveBookingModal = async () => {
    if (!bookingModal) return;
    const { mode, draft } = bookingModal;
    if (
      !draft.fullName.trim() ||
      !draft.email.trim() ||
      !draft.registrationNumber.trim() ||
      !draft.serviceType.trim() ||
      !draft.preferredDate.trim() ||
      !draft.preferredTime.trim()
    ) {
      toast.error(
        "Fill in name, email, booking reference, service, date, and time.",
      );
      return;
    }
    const opts = slotsForIsoDateLocal(draft.preferredDate);
    if (!opts.includes(draft.preferredTime)) {
      toast.error("Pick a valid time for that day.");
      return;
    }

    const registrationNumber = normalizeBookingReference(
      draft.registrationNumber,
    );
    if (!registrationNumber) {
      toast.error("Enter a booking reference.");
      return;
    }

    setBookingModalSaving(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/bookings/admin", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: draft.fullName.trim(),
            email: draft.email.trim(),
            phone: draft.phone.trim(),
            registrationNumber,
            serviceType: draft.serviceType.trim(),
            preferredDate: draft.preferredDate.trim(),
            preferredTime: draft.preferredTime.trim(),
            notes: draft.notes.trim(),
            adminNotes: draft.adminNotes.trim(),
            status: draft.status,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data.error || "Failed to create booking.");
          return;
        }
        if (data.booking) {
          setBookings((prev) => [data.booking, ...prev]);
        }
        toast.success("Booking created.");
        setBookingModal(null);
        return;
      }

      const res = await fetch(`/api/bookings/${draft._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: draft.fullName.trim(),
          email: draft.email.trim(),
          phone: draft.phone.trim(),
          registrationNumber,
          serviceType: draft.serviceType.trim(),
          preferredDate: draft.preferredDate.trim(),
          preferredTime: draft.preferredTime.trim(),
          notes: draft.notes.trim(),
          adminNotes: draft.adminNotes.trim(),
          status: draft.status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to update booking.");
        return;
      }
      if (data.booking) {
        setBookings((prev) =>
          prev.map((b) =>
            String(b?._id) === String(draft._id) ? data.booking : b,
          ),
        );
      }
      toast.success("Booking updated.");
      setBookingModal(null);
    } catch {
      toast.error("Booking save failed.");
    } finally {
      setBookingModalSaving(false);
    }
  };

  const confirmDeleteBooking = async () => {
    const id = bookingPendingDelete?._id;
    if (!id) return;
    setBookingDeleteLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to delete booking.");
        return;
      }
      setBookings((prev) => prev.filter((b) => String(b?._id) !== String(id)));
      toast.success("Booking deleted.");
      setBookingPendingDelete(null);
    } catch {
      toast.error("Failed to delete booking.");
    } finally {
      setBookingDeleteLoading(false);
    }
  };

  const moderateReview = async (reviewId, status) => {
    if (!reviewId) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to update review.");
        return;
      }
      if (data.review) {
        setReviews((prev) =>
          prev.map((r) =>
            String(r?._id) === String(reviewId) ? data.review : r,
          ),
        );
      }
      toast.success(
        status === "approved" ? "Review approved." : "Review rejected.",
      );
    } catch {
      toast.error("Failed to update review.");
    }
  };

  const saveAdminReviewEdit = async (reviewId, rating, comment) => {
    if (!reviewId) throw new Error("save-failed");
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAdminEdit: true,
          rating: Number(rating),
          comment: String(comment || "").trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to save review.");
        throw new Error("save-failed");
      }
      if (data.review) {
        setReviews((prev) =>
          prev.map((r) =>
            String(r?._id) === String(reviewId) ? data.review : r,
          ),
        );
      }
      toast.success("Review updated.");
    } catch (err) {
      if (String(err?.message) !== "save-failed") {
        toast.error("Failed to save review.");
      }
      throw err;
    }
  };

  const confirmDeleteAdminReview = async () => {
    if (!reviewPendingDelete?._id) return;
    setReviewDeleteLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewPendingDelete._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to delete review.");
        return;
      }
      setReviews((prev) =>
        prev.filter(
          (r) => String(r?._id) !== String(reviewPendingDelete._id),
        ),
      );
      toast.success(data.message || "Review deleted.");
      setReviewPendingDelete(null);
    } catch {
      toast.error("Failed to delete review.");
    } finally {
      setReviewDeleteLoading(false);
    }
  };

  const handleLogout = useCallback(async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.dispatchEvent(new Event("auth-changed"));
      router.replace("/login");
    } catch {
      toast.error("Could not log out. Try again.");
    } finally {
      setLogoutLoading(false);
    }
  }, [logoutLoading, router]);

  const saveAdminProfile = async (event) => {
    event.preventDefault();
    if (profileSaving) return;
    setProfileSaving(true);
    try {
      const payload = { name: profileName, email: profileEmail };
      if (currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error("New passwords do not match.");
          setProfileSaving(false);
          return;
        }
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to update profile.");
        return;
      }
      if (data.user) {
        setAdminUser((prev) => ({ ...(prev || {}), ...data.user }));
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(data.message || "Profile updated.");
      window.dispatchEvent(new Event("auth-changed"));
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const markEmailAsRead = async (em) => {
    if (!em?._id || em.isRead) return;
    const id = String(em._id);
    setEmailMarkingReadId(id);
    try {
      const res = await fetch(`/api/emails/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isRead: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Could not mark as read.");
        return;
      }
      const updated = data.email;
      setEmails((prev) =>
        prev.map((e) =>
          String(e?._id) === id
            ? {
                ...e,
                isRead: true,
                readAt: updated?.readAt ?? e.readAt,
              }
            : e,
        ),
      );
      toast.success("Marked as read.");
    } catch {
      toast.error("Could not mark as read.");
    } finally {
      setEmailMarkingReadId(null);
    }
  };

  const confirmDeleteEmail = async () => {
    if (!emailPendingDelete?._id) return;
    setEmailDeleteLoading(true);
    try {
      const res = await fetch(`/api/emails/${emailPendingDelete._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to delete message.");
        return;
      }
      setEmails((prev) =>
        prev.filter((e) => String(e?._id) !== String(emailPendingDelete._id)),
      );
      toast.success(data.message || "Message deleted.");
      setEmailPendingDelete(null);
    } catch {
      toast.error("Failed to delete message.");
    } finally {
      setEmailDeleteLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userPendingDelete?._id) return;
    setUserDeleteLoading(true);
    try {
      const res = await fetch(`/api/users/${userPendingDelete._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to delete user.");
        return;
      }
      setUsers((prev) =>
        prev.filter((x) => String(x?._id) !== String(userPendingDelete._id)),
      );
      if (
        customerOrdersUser &&
        String(customerOrdersUser._id) === String(userPendingDelete._id)
      ) {
        setCustomerOrdersUser(null);
      }
      toast.success(data.message || "User deleted.");
      setUserPendingDelete(null);
    } catch {
      toast.error("Failed to delete user.");
    } finally {
      setUserDeleteLoading(false);
    }
  };

  const adminInitials = useMemo(() => {
    const n = String(adminUser?.name || "A").trim() || "A";
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
    }
    return n.slice(0, 2).toUpperCase();
  }, [adminUser?.name]);

  if (checking) {
    return (
      <div className="relative min-h-[calc(100svh-160px)] bg-[#0a0908] text-stone-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(245,158,11,0.07),transparent_50%)]" />
        <main className="relative z-10 flex min-h-[calc(100svh-160px)] items-center justify-center px-6">
          <div className="rounded-2xl border border-stone-800/60 bg-[#0c0b09]/90 px-6 py-4 text-sm font-semibold text-stone-200 ring-1 ring-white/[0.04] backdrop-blur-xl">
            Loading admin console…
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
    <div className="relative min-h-[calc(100svh-160px)] bg-[#0a0908] text-stone-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(245,158,11,0.07),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_100%_25%,rgba(120,113,108,0.09),transparent_55%)]" />
    <div className="relative z-10 mx-auto grid w-full max-w-screen-2xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[19rem_minmax(0,1fr)] md:items-start md:gap-8">
      {/* self-start: default grid stretch matched aside height to main column, pushing View site / Log out below the fold */}
      <aside className="relative hidden h-fit w-full flex-col md:flex md:self-start md:sticky md:top-24">
        <div
          className="pointer-events-none absolute left-0 top-8 bottom-8 w-px bg-gradient-to-b from-amber-500/55 via-amber-400/12 to-transparent"
          aria-hidden
        />
        <div className="surface-panel relative flex min-h-0 max-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-[1.75rem] border border-stone-800/60 bg-gradient-to-b from-[#0c0b09]/98 via-[#0a0908] to-[#0a0908] p-5 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.75)] ring-1 ring-white/[0.04] sm:p-6">
          <div className="mb-6 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-heading text-2xl font-black tracking-tighter text-amber-400">
                  Studio Salon
                </h1>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Management Suite
                </p>
              </div>
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-[11px] font-black tracking-tight text-amber-200 shadow-inner"
                aria-hidden
              >
                SS
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5 sm:p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] text-xs font-black text-zinc-100 shadow-sm"
                  aria-hidden
                >
                  {adminInitials}
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
                  <p
                    className="truncate text-sm font-semibold text-zinc-100"
                    title={adminUser?.name || undefined}
                  >
                    {adminUser?.name || "Admin"}
                  </p>
                  <p
                    className="truncate text-xs text-zinc-500"
                    title={adminUser?.email || undefined}
                  >
                    {adminUser?.email || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <nav className="mt-0 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.key;
              const badgeCount =
                item.key === "orders"
                  ? adminOrderUpdatesCount
                  : item.key === "reviews"
                    ? adminReviewActivityCount
                    : item.key === "bookings"
                      ? adminBookingNewCount
                      : item.key === "emails"
                        ? adminEmailUnreadCount
                        : 0;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    setActiveSection(item.key);
                    setQuery("");
                  }}
                  className={cx(
                    "group flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2.5 text-left transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-amber-500/18 via-amber-500/8 to-transparent font-bold text-amber-100 shadow-[inset_3px_0_0_0_rgb(245,158,11)]"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={cx(
                        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                        active
                          ? "border-amber-500/35 bg-amber-500/15 text-amber-200"
                          : "border-white/[0.06] bg-white/[0.03] text-zinc-500 group-hover:border-white/10 group-hover:bg-white/[0.06] group-hover:text-zinc-300",
                      )}
                      aria-hidden
                    >
                      <Icon className="size-4 shrink-0" />
                    </span>
                    <span className="truncate text-sm font-heading tracking-tight">
                      {item.label}
                    </span>
                  </span>
                  {active ? (
                    <span
                      className="inline-flex size-6 shrink-0 items-center justify-center"
                      aria-hidden
                    >
                      <span className="size-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.55)] ring-2 ring-amber-500/40" />
                    </span>
                  ) : badgeCount > 0 ? (
                    <span className="inline-flex min-w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-zinc-950">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="mt-5 shrink-0 space-y-2.5 border-t border-white/[0.07] pt-5">
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] py-2.5 text-sm font-semibold text-zinc-50 shadow-sm transition hover:border-white/25 hover:bg-white/[0.12] hover:text-white"
            >
              <ExternalLink className="size-4 shrink-0 text-zinc-300" />
              View site
            </Link>
            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/35 bg-amber-500/15 py-2.5 text-sm font-semibold text-amber-100 shadow-sm transition hover:bg-amber-500/25"
            >
              <LogOut className="size-4 shrink-0" />
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-40 flex w-full min-w-0 items-center gap-3 border-b border-stone-800/50 bg-[#0a0908]/90 px-4 backdrop-blur-md sm:gap-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4">
            <div className="flex shrink-0 items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={openMobileNav}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-100 transition hover:bg-white/10 active:scale-[0.97]"
                aria-label="Open admin navigation"
              >
                <PanelLeft className="size-5" strokeWidth={1.75} />
              </button>
              <span className="hidden min-w-0 truncate sm:inline text-xs font-semibold text-zinc-300">
                {adminSectionLabel(activeSection)}
              </span>
            </div>
            <div className="hidden min-w-0 md:flex md:max-w-[14rem] md:flex-col md:justify-center md:pr-2 lg:max-w-xs">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/90">
                Admin
              </span>
              <span className="truncate font-heading text-lg font-bold tracking-tight text-zinc-50">
                {adminSectionLabel(activeSection)}
              </span>
            </div>
          </div>
          {activeSection !== "settings" &&
          activeSection !== "testimonials" ? (
            <div
              ref={adminSearchWrapRef}
              className="relative w-full min-w-0 max-w-md flex-1 md:max-w-lg"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-zinc-400" />
              <input
                ref={adminSearchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setAdminSuggestSuppressed(false)}
                onKeyDown={(e) => {
                  if (!adminSectionHasSearchAutocomplete(activeSection)) return;
                  const list = adminSearchSuggestions;
                  if (!trimmedAdminQuery || list.length === 0) {
                    if (e.key === "Escape") {
                      setAdminSearchHighlight(-1);
                      setAdminSuggestSuppressed(true);
                    }
                    return;
                  }
                  if (!adminSearchPanelOpen) {
                    if (e.key === "Escape") {
                      setAdminSearchHighlight(-1);
                      setAdminSuggestSuppressed(true);
                    }
                    return;
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setAdminSearchHighlight((i) =>
                      i < list.length - 1 ? i + 1 : 0,
                    );
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setAdminSearchHighlight((i) =>
                      i <= 0 ? list.length - 1 : i - 1,
                    );
                    return;
                  }
                  if (e.key === "Enter" && adminSearchHighlight >= 0) {
                    e.preventDefault();
                    const s = list[adminSearchHighlight];
                    if (s) setQuery(s.queryText);
                    setAdminSearchHighlight(-1);
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setAdminSearchHighlight(-1);
                    setAdminSuggestSuppressed(true);
                  }
                }}
                className="w-full rounded-md bg-zinc-900 px-10 py-2 text-sm text-zinc-100 outline-none ring-1 ring-white/10 placeholder:text-zinc-500 focus:ring-2 focus:ring-amber-500/30"
                placeholder={
                  activeSection === "inventory"
                    ? "Search products by name, slug, category..."
                    : activeSection === "orders" || activeSection === "dashboard"
                      ? "Search orders by number, customer, status..."
                      : activeSection === "reviews"
                        ? "Search reviews by product, customer, comment..."
                        : activeSection === "users"
                          ? "Search users by name, email, role..."
                          : activeSection === "emails"
                            ? "Search messages by name, email, content..."
                            : activeSection === "bookings"
                              ? "Search bookings by name, email, reference, service..."
                              : "Search…"
                }
                type="search"
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls={adminSearchListId}
                aria-expanded={adminSearchPanelOpen}
                aria-activedescendant={
                  adminSearchPanelOpen && adminSearchHighlight >= 0
                    ? `${adminSearchListId}-opt-${adminSearchHighlight}`
                    : undefined
                }
              />
              {trimmedAdminQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setAdminSearchHighlight(-1);
                    window.requestAnimationFrame(() => {
                      adminSearchInputRef.current?.focus?.();
                    });
                  }}
                  className="absolute right-2 top-1/2 z-10 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-white/90 transition hover:bg-white/10 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="size-4 text-white" />
                </button>
              ) : null}
              {adminSearchPanelOpen ? (
                <ul
                  id={adminSearchListId}
                  role="listbox"
                  className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-64 overflow-y-auto rounded-md border border-white/10 bg-zinc-900 py-1 shadow-xl"
                >
                  {adminSearchSuggestions.map((s, i) => (
                    <li key={s.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        id={`${adminSearchListId}-opt-${i}`}
                        aria-selected={i === adminSearchHighlight}
                        className={cx(
                          "flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm transition-colors",
                          i === adminSearchHighlight
                            ? "bg-white/10 text-zinc-50"
                            : "text-zinc-200 hover:bg-white/5",
                        )}
                        onMouseEnter={() => setAdminSearchHighlight(i)}
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={() => {
                          setQuery(s.queryText);
                          setAdminSearchHighlight(-1);
                        }}
                      >
                        <span className="font-medium text-zinc-100">
                          {s.title}
                        </span>
                        {s.subtitle ? (
                          <span className="text-xs text-zinc-500">
                            {s.subtitle}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </header>

        {mobileNavMounted ? (
          <div
            className="fixed inset-0 z-[90] md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
          >
            <button
              type="button"
              className={cx(
                "absolute inset-0 bg-black/75 backdrop-blur-[2px] transition-opacity duration-300",
                mobileNavOpen ? "opacity-100" : "opacity-0",
              )}
              onClick={closeMobileNav}
              aria-label="Close navigation"
            />
            <div
              className={cx(
                "absolute left-0 top-0 h-full w-[min(22rem,92vw)] overflow-y-auto border-r border-stone-800/50 bg-gradient-to-b from-[#0c0b09] via-[#0a0908] to-[#0a0908] px-5 py-7 pb-[max(1.75rem,env(safe-area-inset-bottom))] shadow-[16px_0_48px_-12px_rgba(0,0,0,0.65)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 sm:py-8",
                mobileNavOpen ? "translate-x-0" : "-translate-x-full",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-amber-200 shadow-sm">
                    <span className="text-sm font-black" aria-hidden>
                      SS
                    </span>
                  </div>
                  <div className="min-w-0 py-0.5">
                    <p className="truncate font-heading text-lg font-extrabold tracking-tight text-zinc-50">
                      Studio Salon
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
                      MANAGEMENT SUITE
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeMobileNav}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-200 shadow-sm transition duration-200 hover:bg-white/10 active:scale-[0.98]"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-black text-zinc-100 shadow-sm"
                    aria-hidden
                  >
                    {adminInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-100">
                      {adminUser?.name || "Admin"}
                    </p>
                    <p className="mt-1 truncate text-xs leading-relaxed text-zinc-500">
                      {adminUser?.email || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="mt-7 space-y-2.5">
                {ADMIN_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = activeSection === item.key;
                  const badgeCount =
                    item.key === "orders"
                      ? adminOrderUpdatesCount
                      : item.key === "reviews"
                        ? adminReviewActivityCount
                        : item.key === "bookings"
                          ? adminBookingNewCount
                          : item.key === "emails"
                            ? adminEmailUnreadCount
                            : 0;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={() => {
                        setActiveSection(item.key);
                        setQuery("");
                        closeMobileNav();
                      }}
                      className={cx(
                        "group relative flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition duration-200",
                        active
                          ? "border-amber-500/35 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-white/[0.02] text-amber-50"
                          : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/5",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={cx(
                            "inline-flex size-9 shrink-0 items-center justify-center rounded-xl border",
                            active
                              ? "border-amber-500/35 bg-amber-500/15 text-amber-200"
                              : "border-white/10 bg-white/5 text-zinc-300 group-hover:bg-white/10",
                          )}
                          aria-hidden
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="truncate text-sm font-semibold">
                          {item.label}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {badgeCount > 0 ? (
                          <span className="inline-flex min-w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-zinc-950">
                            {badgeCount > 9 ? "9+" : badgeCount}
                          </span>
                        ) : null}
                        {active ? (
                          <span
                            className="size-2 shrink-0 rounded-full bg-amber-500"
                            aria-hidden
                          />
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-8 shrink-0 border-t border-white/10 pt-6">
                <Link
                  href="/"
                  onClick={closeMobileNav}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3.5 text-sm font-semibold text-zinc-50 shadow-sm transition duration-200 hover:border-white/25 hover:bg-white/[0.12] active:scale-[0.99]"
                >
                  <ExternalLink className="size-4 shrink-0 text-zinc-300" />
                  View site
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    closeMobileNav();
                    setLogoutConfirmOpen(true);
                  }}
                  className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/35 bg-amber-500/15 px-4 py-3.5 text-sm font-semibold text-amber-100 shadow-sm transition duration-200 hover:bg-amber-500/25 active:scale-[0.99]"
                >
                  <LogOut className="size-4 shrink-0" />
                  Log out
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-8 p-4 sm:p-6 lg:p-8">
          {dataLoading ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-zinc-200">
              Loading data…
            </div>
          ) : null}

          {activeSection === "dashboard" ? (
            <>
              <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
                  <div>
                    <h2 className="font-heading text-2xl font-extrabold tracking-tighter text-zinc-50 sm:text-3xl">
                      Platform Overview
                    </h2>
                    <p className="mt-1 text-sm text-zinc-300">
                      Bookings, store, and salon content at a glance.
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-200">
                    Last seen •{" "}
                    {formatUserActivityAgo(adminUser, [])}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-white/10 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
                    onClick={handleExportReportPdf}
                  >
                    Export Report (PDF)
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-amber-500 px-4 py-2 text-sm font-black text-zinc-950 shadow-lg shadow-amber-500/15 transition active:scale-95"
                    onClick={handleDownloadAnalyticsPdf}
                  >
                    Download Analytics (PDF)
                  </button>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {kpis.map((kpi) => {
                  const Icon = kpi.icon;
                  const isPendingReviews = kpi.label === "Pending Reviews";
                  return (
                    <article
                      key={kpi.label}
                      role={isPendingReviews ? "button" : undefined}
                      tabIndex={isPendingReviews ? 0 : undefined}
                      onClick={
                        isPendingReviews
                          ? () => {
                              setActiveSection("reviews");
                              setReviewStatusFilter("pending");
                              setQuery("");
                            }
                          : undefined
                      }
                      onKeyDown={
                        isPendingReviews
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setActiveSection("reviews");
                                setReviewStatusFilter("pending");
                                setQuery("");
                              }
                            }
                          : undefined
                      }
                      className={cx(
                        "group relative overflow-hidden rounded-md border-l-4 bg-zinc-900 p-6",
                        kpi.accent,
                        isPendingReviews
                          ? "cursor-pointer transition hover:bg-zinc-800/80"
                          : "",
                      )}
                    >
                      <div className="pointer-events-none absolute -bottom-6 -right-6 opacity-10 transition-transform group-hover:scale-110">
                        <Icon className="size-20" />
                      </div>
                      <p className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                        {kpi.label}
                      </p>
                      <h3 className="font-heading text-3xl font-extrabold text-zinc-50">
                        {kpi.value}
                      </h3>
                      <div
                        className={cx("mt-4 flex items-center gap-2 text-xs", kpi.tone)}
                      >
                        <TrendingUp className="size-4" />
                        <span>{kpi.note}</span>
                      </div>
                    </article>
                  );
                })}
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-xl font-bold tracking-tight text-zinc-50">
                    Orders (preview)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveSection("orders")}
                    className="inline-flex items-center gap-1 text-xs font-black text-amber-300 hover:underline"
                  >
                    VIEW ALL <ChevronRight className="size-4" />
                  </button>
                </div>
                <OrdersTable
                  rows={filteredOrders.slice(0, 6)}
                  products={products}
                  onUpdate={updateOrderStatus}
                  onRequestDelete={(o) => setOrderPendingDelete(o)}
                  compact
                  emptyMessage={
                    query.trim()
                      ? "No orders match your search."
                      : "No orders yet."
                  }
                />
              </section>
            </>
          ) : null}

          {activeSection === "inventory" ? (
            <SectionShell
              title="Inventory Management"
              subtitle="Manage your product catalog and stock levels."
              icon={Boxes}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-stone-400">
                  Create, update, and remove products from your store.
                </p>
                <button
                  type="button"
                  onClick={openCreateProduct}
                  className="inline-flex items-center justify-center rounded-full bg-stone-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-950 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition hover:bg-amber-50 active:scale-95"
                >
                  <PlusCircle className="mr-2 size-4" />
                  Create product
                </button>
              </div>
              {filteredProducts.length ? (
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/50 pb-3">
                  <p className="text-sm text-stone-500">
                    {filteredProducts.length} product
                    {filteredProducts.length === 1 ? "" : "s"}
                    {query.trim() ? " (search)" : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setInventoryPage((p) => Math.max(1, p - 1))
                      }
                      disabled={inventoryPage <= 1}
                      aria-label="Previous page"
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-stone-800/60 bg-[#0c0b09] text-stone-200 transition hover:border-stone-700/70 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
                      Page {inventoryPage} / {inventoryTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setInventoryPage((p) =>
                          Math.min(inventoryTotalPages, p + 1),
                        )
                      }
                      disabled={inventoryPage >= inventoryTotalPages}
                      aria-label="Next page"
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-stone-800/60 bg-[#0c0b09] text-stone-200 transition hover:border-stone-700/70 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              ) : null}
              <InventoryTable
                rows={pagedProducts}
                emptyMessage={
                  query.trim()
                    ? "No products match your search."
                    : "No products found."
                }
                onRequestDelete={(p) => setProductPendingDelete(p)}
                onToggleInStock={toggleInStock}
                onView={openViewProduct}
                onEdit={openEditProduct}
              />
            </SectionShell>
          ) : null}

          {activeSection === "orders" ? (
            <SectionShell
              title="Customer Orders"
              subtitle="Track fulfillment and payment status for every order."
              icon={ShoppingCart}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <p className="text-sm text-zinc-400">
                  {filteredOrders.length} order
                  {filteredOrders.length === 1 ? "" : "s"}
                  {query.trim() ? " (search)" : ""}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                    disabled={orderPage <= 1}
                    aria-label="Previous page"
                    className="inline-flex size-8 items-center justify-center rounded border border-white/10 bg-zinc-900 text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                    Page {orderPage} / {ordersTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setOrderPage((p) => Math.min(ordersTotalPages, p + 1))
                    }
                    disabled={orderPage >= ordersTotalPages}
                    aria-label="Next page"
                    className="inline-flex size-8 items-center justify-center rounded border border-white/10 bg-zinc-900 text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
              <OrdersTable
                rows={pagedOrders}
                products={products}
                onUpdate={updateOrderStatus}
                onRequestDelete={(o) => setOrderPendingDelete(o)}
                emptyMessage={
                  query.trim()
                    ? "No orders match your search."
                    : "No orders yet."
                }
              />
            </SectionShell>
          ) : null}

          {activeSection === "reviews" ? (
            <SectionShell
              title="Product Reviews"
              subtitle="Moderate customer reviews. Approve to publish on product pages; reject or delete as needed."
              icon={MessageSquare}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all", label: "All" },
                    { key: "pending", label: "Pending" },
                    { key: "approved", label: "Approved" },
                    { key: "rejected", label: "Rejected" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setReviewStatusFilter(tab.key)}
                      className={cx(
                        "rounded border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition",
                        reviewStatusFilter === tab.key
                          ? "border-amber-500 bg-amber-500/15 text-amber-200"
                          : "border-white/10 bg-zinc-900 text-zinc-300 hover:border-white/20",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-zinc-400">
                    {filteredReviews.length} match
                    {query.trim() ? " (with search)" : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                      disabled={reviewPage <= 1}
                      aria-label="Previous page"
                      className="inline-flex size-8 items-center justify-center rounded border border-white/10 bg-zinc-900 text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                      Page {reviewPage} / {reviewsTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setReviewPage((p) => Math.min(reviewsTotalPages, p + 1))
                      }
                      disabled={reviewPage >= reviewsTotalPages}
                      aria-label="Next page"
                      className="inline-flex size-8 items-center justify-center rounded border border-white/10 bg-zinc-900 text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
              <ReviewsTable
                rows={pagedReviews}
                products={products}
                onApprove={(id) => moderateReview(id, "approved")}
                onReject={(id) => moderateReview(id, "rejected")}
                onRequestDelete={(r) => setReviewPendingDelete(r)}
                onSaveEdit={saveAdminReviewEdit}
              />
            </SectionShell>
          ) : null}

          {activeSection === "testimonials" ? (
            <SectionShell
              title="Testimonials"
              subtitle="Quotes for the About page (above the bottom CTA). Superadmin only."
              icon={Quote}
            >
              <TestimonialsAdminPanel />
            </SectionShell>
          ) : null}

          {activeSection === "bookings" ? (
            <SectionShell
              title="Service Bookings"
              subtitle="Confirmed bookings email the customer (with PDF) and BOOKING_ADMIN_EMAIL recipients. Use View / Download for the same PDF. Only one active booking per date and time (pending, confirmed, or waitlisted)."
              icon={ClipboardList}
              headerActions={
                <button
                  type="button"
                  onClick={() =>
                    setBookingModal({
                      mode: "create",
                      draft: emptyBookingDraft(),
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-amber-200 transition hover:bg-amber-500/20"
                >
                  <PlusCircle className="size-4" />
                  Add booking
                </button>
              }
            >
              <div className="space-y-4">
                {bookings.length ? (
                  filteredBookings.length ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                        <p className="text-sm text-zinc-400">
                          {filteredBookings.length} booking
                          {filteredBookings.length === 1 ? "" : "s"}
                          {query.trim() ? " (search)" : ""}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setBookingPage((p) => Math.max(1, p - 1))
                            }
                            disabled={bookingPage <= 1}
                            aria-label="Previous page"
                            className="inline-flex size-8 items-center justify-center rounded border border-white/10 bg-zinc-900 text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <ChevronLeft className="size-4" />
                          </button>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                            Page {bookingPage} / {bookingsTotalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setBookingPage((p) =>
                                Math.min(bookingsTotalPages, p + 1),
                              )
                            }
                            disabled={bookingPage >= bookingsTotalPages}
                            aria-label="Next page"
                            className="inline-flex size-8 items-center justify-center rounded border border-white/10 bg-zinc-900 text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {pagedBookings.map((b) => {
                          const st = String(b.status || "").toLowerCase();
                          const busy = bookingUpdatingId === String(b._id);
                          const canDelete =
                            st === "cancelled" || st === "completed";
                          const ref = bookingRefCode(b);
                          const pdfBase = `/api/bookings/${encodeURIComponent(String(b._id))}/pdf`;
                          const placed = b.createdAt
                            ? new Date(b.createdAt).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "—";
                          const rowIcon =
                            "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400";
                          return (
                            <article
                              key={b._id}
                              className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 shadow-sm"
                            >
                              <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.02] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                          <div>
                            <p className="font-mono text-base font-bold tracking-tight text-zinc-50">
                              # {ref}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              Placed {placed}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={pdfBase}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-transparent px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-200 transition hover:border-white/25 hover:bg-white/5"
                            >
                              <FileText className="size-3.5" />
                              View booking
                            </a>
                            <a
                              href={`${pdfBase}?download=1`}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-transparent px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-200 transition hover:border-white/25 hover:bg-white/5"
                            >
                              <Download className="size-3.5" />
                              Download booking
                            </a>
                          </div>
                        </div>

                        <div className="grid divide-y divide-white/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                          <div className="p-4 sm:p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                              Recipient
                            </p>
                            <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <div className="flex items-center gap-3">
                                <span className={rowIcon}>
                                  <User className="size-4" />
                                </span>
                                <span className="text-sm font-semibold text-zinc-100">
                                  {b.fullName || "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={rowIcon}>
                                  <Mail className="size-4" />
                                </span>
                                <span className="break-all text-sm text-zinc-300">
                                  {b.email || "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={rowIcon}>
                                  <Phone className="size-4" />
                                </span>
                                <span className="text-sm text-zinc-300">
                                  {b.phone || "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={rowIcon}>
                                  <Tag className="size-4" />
                                </span>
                                <span className="text-sm text-zinc-300">
                                  {b.registrationNumber
                                    ? `Ref ${String(b.registrationNumber).trim()}`
                                    : "Reference —"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 sm:p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                              Service detail
                            </p>
                            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <p className="text-sm font-semibold text-zinc-100">
                                {b.serviceType || "—"}
                              </p>
                              <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs text-zinc-400">
                                <p>
                                  <span className="inline-flex items-center gap-1.5 font-bold text-zinc-500">
                                    <Calendar className="size-3.5" />
                                    Date
                                  </span>{" "}
                                  {b.preferredDate || "—"}
                                </p>
                                <p>
                                  <span className="inline-flex items-center gap-1.5 font-bold text-zinc-500">
                                    <Clock3 className="size-3.5" />
                                    Time
                                  </span>{" "}
                                  {b.preferredTime ? formatSlotLabel(b.preferredTime) : "—"}
                                </p>
                              </div>
                            </div>
                            {b.notes ? (
                              <p className="mt-4 whitespace-pre-wrap text-xs leading-relaxed text-zinc-500">
                                {b.notes}
                              </p>
                            ) : null}
                            {b.adminNotes ? (
                              <p className="mt-3 whitespace-pre-wrap border-t border-white/10 pt-3 text-xs text-amber-200/90">
                                <span className="font-bold text-amber-300/90">
                                  Admin:{" "}
                                </span>
                                {b.adminNotes}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex flex-col p-4 sm:p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                              Status & actions
                            </p>
                            <p className="mt-3 text-lg font-bold capitalize text-zinc-100">
                              {String(b.status || "pending")}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              Workshop appointment
                            </p>

                            <div className="mt-auto flex flex-col gap-2 pt-6">
                              {st !== "completed" && st !== "cancelled" ? (
                                <button
                                  type="button"
                                  disabled={busy || bookingModalSaving}
                                  onClick={() =>
                                    setBookingModal({
                                      mode: "edit",
                                      draft: bookingToDraft(b),
                                    })
                                  }
                                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-200 transition hover:bg-white/10 disabled:opacity-50"
                                >
                                  <PencilLine className="size-3.5" />
                                  Edit
                                </button>
                              ) : null}
                              {st !== "completed" && st !== "cancelled" ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() =>
                                      patchBookingStatus(b._id, "completed")
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 py-2.5 text-[10px] font-black uppercase tracking-widest text-sky-100 transition hover:bg-sky-500/25 disabled:opacity-50"
                                  >
                                    <CheckCircle2 className="size-3.5" />
                                    Complete
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() =>
                                      patchBookingStatus(b._id, "cancelled")
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 py-2.5 text-[10px] font-black uppercase tracking-widest text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-50"
                                  >
                                    Cancel booking
                                  </button>
                                </>
                              ) : null}
                              {canDelete ? (
                                <button
                                  type="button"
                                  disabled={busy || bookingModalSaving}
                                  onClick={() => setBookingPendingDelete(b)}
                                  className="inline-flex w-fit max-w-full items-center justify-center gap-2 self-center rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
                                >
                                  <Trash2 className="size-3.5" />
                                  Delete record
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                            </article>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-zinc-400">
                    {`No bookings match "${query.trim()}". Clear the search field to see all bookings.`}
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-zinc-400">
                  No bookings yet.{" "}
                  <Link
                    href="/book-a-service"
                    className="font-semibold text-amber-400 underline-offset-2 hover:underline"
                  >
                    Open the booking page
                  </Link>
                </div>
              )}
              </div>
            </SectionShell>
          ) : null}

          {activeSection === "users" ? (
            <SectionShell
              title="Users"
              subtitle="Registered customer accounts."
              icon={Users}
            >
              <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 sm:p-6">
                {filteredUsers.length ? (
                  <>
                    <div className="space-y-4">
                      {pagedUsers.map((u) => {
                        const uid = String(u?._id || "");
                        const adminId = String(
                          adminUser?.id ?? adminUser?._id ?? "",
                        );
                        const isSuperadminRow =
                          String(u?.role || "").toLowerCase() === "superadmin";
                        const isSelf = Boolean(
                          uid && adminId && uid === adminId,
                        );
                        const showDelete = !isSuperadminRow && !isSelf;
                        return (
                          <article
                            key={uid || u?.email}
                            className="surface-panel rounded-2xl border border-white/10 p-4 sm:p-5"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="flex min-w-0 gap-4">
                                <div
                                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg font-bold text-zinc-100"
                                  aria-hidden
                                >
                                  {userAvatarLetter(u)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-heading text-base font-bold text-zinc-50">
                                      {u?.name || "—"}
                                    </span>
                                    <span className="rounded-md border border-sky-500/35 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-200">
                                      {u?.role || "—"}
                                    </span>
                                  </div>
                                  <p className="mt-1 truncate text-sm text-zinc-400">
                                    {u?.email || "—"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setCustomerOrdersUser(u)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-100 transition hover:bg-white/10"
                                >
                                  <Eye className="size-4 text-zinc-300" />
                                  View activity
                                </button>
                                {showDelete ? (
                                  <button
                                    type="button"
                                    onClick={() => setUserPendingDelete(u)}
                                    className="inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-200 transition hover:bg-red-500/20"
                                    aria-label={`Delete user ${u?.name || u?.email || ""}`}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                ) : null}
                              </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                  Recent order
                                </p>
                                <p className="mt-1 text-sm font-bold capitalize text-zinc-100">
                                  {recentOrderLabel(u?.latestOrderStatus)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                  Orders
                                </p>
                                <p className="mt-1 text-sm font-bold text-zinc-100">
                                  {safeNum(u?.orderCount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                  Approved
                                </p>
                                <p className="mt-1 text-sm font-bold text-emerald-400">
                                  {safeNum(u?.approvedReviews)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                  Pending
                                </p>
                                <p className="mt-1 text-sm font-bold text-amber-300">
                                  {safeNum(u?.pendingReviews)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                Account created:{" "}
                                <span className="text-zinc-400">
                                  {accountCreatedUsShort(u?.createdAt)}
                                </span>
                              </p>
                              <details className="group relative">
                                <summary className="flex cursor-pointer list-none items-center justify-center rounded-lg p-2 text-sky-400/90 transition hover:bg-white/5 hover:text-sky-300 [&::-webkit-details-marker]:hidden">
                                  <MoreHorizontal className="size-5" />
                                  <span className="sr-only">More options</span>
                                </summary>
                                <div className="absolute right-0 top-full z-10 mt-1 min-w-[11rem] rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-xl">
                                  <button
                                    type="button"
                                    onClick={() => setCustomerOrdersUser(u)}
                                    className="flex w-full px-3 py-2 text-left text-xs font-semibold text-zinc-200 hover:bg-white/5"
                                  >
                                    View activity
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const em = String(u?.email || "").trim();
                                      if (!em) return;
                                      void navigator.clipboard
                                        ?.writeText(em)
                                        .then(() =>
                                          toast.success("Email copied."),
                                        )
                                        .catch(() =>
                                          toast.error("Could not copy."),
                                        );
                                    }}
                                    className="flex w-full px-3 py-2 text-left text-xs font-semibold text-zinc-200 hover:bg-white/5"
                                  >
                                    Copy email
                                  </button>
                                </div>
                              </details>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          setUserPage((p) => Math.max(1, p - 1))
                        }
                        disabled={userPage <= 1}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="size-4" />
                        Previous
                      </button>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Page {userPage} / {usersTotalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setUserPage((p) =>
                            Math.min(usersTotalPages, p + 1),
                          )
                        }
                        disabled={userPage >= usersTotalPages}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-sm text-zinc-400">
                    No users match your search.
                  </div>
                )}
              </div>
            </SectionShell>
          ) : null}

          {activeSection === "emails" ? (
            <SectionShell
              title="Emails"
              subtitle="Messages from the contact form. Use Mark as read to clear unread badges in the sidebar."
              icon={Mail}
            >
              <div className="space-y-3">
                {filteredEmails.length ? (
                  filteredEmails.map((em) => (
                    <article
                      key={em._id}
                      className={cx(
                        "rounded-2xl border p-4 sm:p-5",
                        em.isRead
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-amber-500/25 bg-amber-500/5",
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-50">{em.name || "—"}</p>
                          <p className="text-sm text-zinc-400">{em.email || "—"}</p>
                          {em.phone ? (
                            <p className="mt-1 text-xs text-zinc-500">{em.phone}</p>
                          ) : null}
                          {em.topic ? (
                            <p className="mt-1 text-xs font-semibold text-amber-200/90">
                              {em.topic}
                            </p>
                          ) : null}
                          {em.company ? (
                            <p className="mt-1 text-xs text-zinc-500">{em.company}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {!em.isRead ? (
                            <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                              Unread
                            </span>
                          ) : null}
                          <span className="text-xs text-zinc-500">
                            {em.createdAt
                              ? new Date(em.createdAt).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : ""}
                          </span>
                          {!em.isRead ? (
                            <button
                              type="button"
                              onClick={() => markEmailAsRead(em)}
                              disabled={emailMarkingReadId === String(em._id)}
                              className="inline-flex items-center gap-1 rounded border border-emerald-500/35 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {emailMarkingReadId === String(em._id) ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <MailOpen className="size-3" />
                              )}
                              Mark read
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setEmailPendingDelete(em)}
                            className="inline-flex items-center gap-1 rounded border border-white/10 bg-red-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-100 transition hover:bg-red-500/25"
                          >
                            <Trash2 className="size-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                        {em.message || "—"}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-zinc-400">
                    No messages match your search.
                  </div>
                )}
              </div>
            </SectionShell>
          ) : null}

          {activeSection === "settings" ? (
            <SectionShell
              title="Settings"
              subtitle="Hero and section images and copy — saved to the site settings document."
              icon={Settings}
            >
              <SiteSettingsPanel active />
            </SectionShell>
          ) : null}

          {activeSection === "profile" ? (
            <SectionShell
              title="Profile"
              subtitle="Update your admin name, email, and password."
              icon={UserCircle}
            >
              <form
                onSubmit={saveAdminProfile}
                className={cx(storePanelClass, "max-w-2xl p-6 sm:p-8")}
              >
                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                      Name
                    </span>
                    <input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className={cx(authInputClass, "h-11 py-0")}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                      Email
                    </span>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className={cx(authInputClass, "h-11 py-0")}
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                        Current password
                      </span>
                      <div className="relative">
                        <input
                          type={
                            profilePasswordVisible.current ? "text" : "password"
                          }
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          autoComplete="current-password"
                          className={cx(authInputClass, "h-11 py-0 pr-12")}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProfilePasswordVisible((prev) => ({
                              ...prev,
                              current: !prev.current,
                            }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-500 transition-colors hover:text-stone-200"
                          aria-label={
                            profilePasswordVisible.current
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {profilePasswordVisible.current ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                        New password
                      </span>
                      <div className="relative">
                        <input
                          type={profilePasswordVisible.new ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                          className={cx(authInputClass, "h-11 py-0 pr-12")}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProfilePasswordVisible((prev) => ({
                              ...prev,
                              new: !prev.new,
                            }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-500 transition-colors hover:text-stone-200"
                          aria-label={
                            profilePasswordVisible.new
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {profilePasswordVisible.new ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                      Confirm new password
                    </span>
                    <div className="relative">
                      <input
                        type={profilePasswordVisible.confirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className={cx(authInputClass, "h-11 py-0 pr-12")}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setProfilePasswordVisible((prev) => ({
                            ...prev,
                            confirm: !prev.confirm,
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-500 transition-colors hover:text-stone-200"
                        aria-label={
                          profilePasswordVisible.confirm
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {profilePasswordVisible.confirm ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className={cx(
                      authPrimaryButtonClass,
                      "!w-auto min-w-[12rem] px-8 py-3.5 disabled:cursor-not-allowed disabled:opacity-60",
                    )}
                  >
                    {profileSaving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </button>
                </div>
              </form>
            </SectionShell>
          ) : null}

          {activeSection === "analytics" ? (
            <SectionShell
              title="Analytics"
              subtitle="Revenue and activity across your store."
              icon={BarChart3}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-zinc-300">
                  {analyticsWindow.label}
                  {analyticsWindow.previous ? " (compared to previous period)" : ""}
                </p>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
                  {[
                    { key: "7d", label: "7d" },
                    { key: "30d", label: "30d" },
                    { key: "90d", label: "90d" },
                    { key: "all", label: "All" },
                  ].map((opt) => {
                    const active = analyticsRange === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setAnalyticsRange(opt.key)}
                        className={cx(
                          "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest transition",
                          active
                            ? "bg-amber-500 text-zinc-950"
                            : "text-zinc-300 hover:bg-white/10",
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {analyticsKpis.map((kpi) => {
                  const Icon = kpi.icon;
                  const hasDelta = typeof kpi.delta === "number";
                  const deltaUp = hasDelta ? kpi.delta > 0 : false;
                  const deltaDown = hasDelta ? kpi.delta < 0 : false;
                  return (
                    <article
                      key={kpi.label}
                      className={cx(
                        "group relative overflow-hidden rounded-md border-l-4 bg-zinc-900 p-6",
                        kpi.accent,
                      )}
                    >
                      <div className="pointer-events-none absolute -bottom-6 -right-6 opacity-10 transition-transform group-hover:scale-110">
                        <Icon className="size-20" />
                      </div>
                      <p className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                        {kpi.label}
                      </p>
                      <h3 className="font-heading text-3xl font-extrabold text-zinc-50">
                        {kpi.value}
                      </h3>
                      {analyticsWindow.previous ? (
                        <div className="mt-3 flex items-center gap-2">
                          {hasDelta ? (
                            <span
                              className={cx(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                                deltaUp
                                  ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
                                  : deltaDown
                                    ? "border-red-500/35 bg-red-500/10 text-red-200"
                                    : "border-white/10 bg-white/5 text-zinc-300",
                              )}
                            >
                              {deltaUp ? (
                                <TrendingUp className="size-3.5" />
                              ) : deltaDown ? (
                                <TrendingDown className="size-3.5" />
                              ) : (
                                <TrendingUp className="size-3.5 opacity-50" />
                              )}
                              {Math.abs(kpi.delta).toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                              —
                            </span>
                          )}
                        </div>
                      ) : null}
                      <div
                        className={cx("mt-4 flex items-center gap-2 text-xs", kpi.tone)}
                      >
                        <TrendingUp className="size-4" />
                        <span>{kpi.note}</span>
                      </div>
                    </article>
                  );
                })}
              </section>

              <div className="rounded-md border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="size-5 text-amber-300" />
                    <h4 className="font-heading font-bold text-zinc-50">
                      Revenue bars (paid orders)
                    </h4>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    Total: {formatCurrency(analyticsScoped.revenue)}
                  </span>
                </div>
                <RevenueBars orders={filteredOrdersForWindow} />
              </div>

              <div className="rounded-md border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="size-5 text-amber-300" />
                    <h4 className="font-heading font-bold text-zinc-50">
                      Paid orders by provider
                    </h4>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    Stripe vs PayPal
                  </span>
                </div>
                <PaymentProviderPie orders={filteredOrdersForWindow} />
              </div>
            </SectionShell>
          ) : null}
        </div>
      </main>
    </div>
    </div>

      {logoutConfirmOpen ? (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-[#0a0908]/65 px-4 py-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-logout-title"
        >
          <div className="surface-panel w-full max-w-md rounded-4xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-200">
                  Session
                </p>
                <h2
                  id="admin-logout-title"
                  className="mt-2 text-2xl font-extrabold text-zinc-50"
                >
                  Log out of admin?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => !logoutLoading && setLogoutConfirmOpen(false)}
                disabled={logoutLoading}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-300">
              You will need to sign in again to access the management suite.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                disabled={logoutLoading}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Stay signed in
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {logoutLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Logging out…
                  </>
                ) : (
                  <>
                    <LogOut className="size-4" />
                    Log out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {customerOrdersUser ? (
        <CustomerOrdersModal
          user={customerOrdersUser}
          orders={customerUserOrders}
          products={products}
          onClose={() => setCustomerOrdersUser(null)}
          onRequestDeleteOrder={(o) => setOrderPendingDelete(o)}
        />
      ) : null}

      {bookingModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0a0908]/75 px-4 py-10 backdrop-blur-sm">
          <div className="surface-panel max-h-[min(90vh,40rem)] w-full max-w-lg overflow-y-auto rounded-3xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-amber-200">
                  {bookingModal.mode === "create" ? "New booking" : "Edit booking"}
                </p>
                <h2 className="mt-2 text-xl font-extrabold text-zinc-50">
                  {bookingModal.mode === "create"
                    ? "Create appointment"
                    : "Update details"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => !bookingModalSaving && setBookingModal(null)}
                disabled={bookingModalSaving}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-1.5 text-sm">
                <span className="text-xs font-semibold text-zinc-400">
                  Full name
                </span>
                <input
                  value={bookingModal.draft.fullName}
                  onChange={(e) =>
                    updateBookingDraft("fullName", e.target.value)
                  }
                  className="rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-xs font-semibold text-zinc-400">
                  Email
                </span>
                <input
                  type="email"
                  value={bookingModal.draft.email}
                  onChange={(e) =>
                    updateBookingDraft("email", e.target.value)
                  }
                  className="rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-xs font-semibold text-zinc-400">
                  Phone
                </span>
                <input
                  value={bookingModal.draft.phone}
                  onChange={(e) =>
                    updateBookingDraft("phone", e.target.value)
                  }
                  className="rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400">
                  <Tag className="size-3.5 shrink-0 text-zinc-500" aria-hidden />
                  Booking reference
                </span>
                <input
                  value={bookingModal.draft.registrationNumber}
                  onChange={(e) =>
                    updateBookingDraft(
                      "registrationNumber",
                      e.target.value.slice(0, BOOKING_REFERENCE_MAX_LEN),
                    )
                  }
                  placeholder="e.g. Your name, a nickname, or your pet’s name"
                  className="rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-xs font-semibold text-zinc-400">
                  Service type
                </span>
                <select
                  value={bookingModal.draft.serviceType}
                  onChange={(e) =>
                    updateBookingDraft("serviceType", e.target.value)
                  }
                  className="rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option>Haircut & finish</option>
                  <option>Color / gloss</option>
                  <option>Treatment & repair</option>
                  <option>Bridal or event styling</option>
                  <option>Consultation</option>
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="text-xs font-semibold text-zinc-400">
                    Date
                  </span>
                  <input
                    type="date"
                    min={(() => {
                      const n = new Date();
                      return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
                    })()}
                    value={bookingModal.draft.preferredDate}
                    onChange={(e) =>
                      updateBookingDraft("preferredDate", e.target.value)
                    }
                    className="rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="text-xs font-semibold text-zinc-400">
                    Time
                  </span>
                  <select
                    value={bookingModal.draft.preferredTime}
                    disabled={
                      !slotsForIsoDateLocal(
                        bookingModal.draft.preferredDate,
                      ).length
                    }
                    onChange={(e) =>
                      updateBookingDraft("preferredTime", e.target.value)
                    }
                    className="rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50"
                  >
                    {!slotsForIsoDateLocal(bookingModal.draft.preferredDate)
                      .length ? (
                      <option value="">Pick a date</option>
                    ) : (
                      slotsForIsoDateLocal(
                        bookingModal.draft.preferredDate,
                      ).map((t) => (
                        <option key={t} value={t}>
                          {formatSlotLabel(t)}
                        </option>
                      ))
                    )}
                  </select>
                </label>
              </div>
              <label className="grid gap-1.5 text-sm">
                <span className="text-xs font-semibold text-zinc-400">
                  Status
                </span>
                <select
                  value={bookingModal.draft.status}
                  onChange={(e) =>
                    updateBookingDraft("status", e.target.value)
                  }
                  className="rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="waitlisted">Waitlisted</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-xs font-semibold text-zinc-400">
                  Customer notes
                </span>
                <textarea
                  rows={2}
                  value={bookingModal.draft.notes}
                  onChange={(e) =>
                    updateBookingDraft("notes", e.target.value)
                  }
                  className="resize-y rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-xs font-semibold text-zinc-400">
                  Admin notes
                </span>
                <textarea
                  rows={2}
                  value={bookingModal.draft.adminNotes}
                  onChange={(e) =>
                    updateBookingDraft("adminNotes", e.target.value)
                  }
                  className="resize-y rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setBookingModal(null)}
                disabled={bookingModalSaving}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={saveBookingModal}
                disabled={bookingModalSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-60"
              >
                {bookingModalSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : bookingModal.mode === "create" ? (
                  "Create"
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bookingPendingDelete ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0a0908]/65 px-4 py-10 backdrop-blur-sm">
          <div className="surface-panel w-full max-w-md rounded-4xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-200">
                  Delete booking
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-zinc-50">
                  Remove this record?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBookingPendingDelete(null)}
                disabled={bookingDeleteLoading}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-300">
              Permanently delete the booking for{" "}
              <span className="font-semibold text-zinc-50">
                {bookingPendingDelete.fullName}
              </span>{" "}
              ({bookingPendingDelete.preferredDate}
              {bookingPendingDelete.preferredTime
                ? ` · ${formatSlotLabel(bookingPendingDelete.preferredTime)}`
                : ""}
              ). This cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setBookingPendingDelete(null)}
                disabled={bookingDeleteLoading}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={confirmDeleteBooking}
                disabled={bookingDeleteLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-500 disabled:opacity-60"
              >
                {bookingDeleteLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Delete booking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {userPendingDelete ? (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-[#0a0908]/65 px-4 py-10 backdrop-blur-sm">
          <div className="surface-panel w-full max-w-md rounded-4xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-200">
                  Delete user
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-zinc-50">
                  Remove this account?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setUserPendingDelete(null)}
                disabled={userDeleteLoading}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-300">
              This will permanently delete{" "}
              <span className="font-semibold text-zinc-50">
                {userPendingDelete.name || userPendingDelete.email}
              </span>{" "}
              and cannot be undone.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setUserPendingDelete(null)}
                disabled={userDeleteLoading}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={userDeleteLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {userDeleteLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Delete user
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reviewPendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0908]/65 px-4 py-10 backdrop-blur-sm">
          <div className="surface-panel w-full max-w-md rounded-4xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-200">
                  Delete review
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-zinc-50">
                  Remove this review?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setReviewPendingDelete(null)}
                disabled={reviewDeleteLoading}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-300">
              This will permanently delete this customer review for{" "}
              <span className="font-semibold text-zinc-50">
                {reviewPendingDelete.productName}
              </span>
              . Product ratings will be recalculated if it was approved.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setReviewPendingDelete(null)}
                disabled={reviewDeleteLoading}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAdminReview}
                disabled={reviewDeleteLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reviewDeleteLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Yes, delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {productPendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0908]/65 px-4 py-10 backdrop-blur-sm">
          <div className="surface-panel w-full max-w-md rounded-4xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-200">
                  Delete product
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-zinc-50">
                  Remove this product?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setProductPendingDelete(null)}
                disabled={productDeleteLoading}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-300">
              This will permanently delete{" "}
              <span className="font-semibold text-zinc-50">
                {productPendingDelete.name || "this product"}
              </span>{" "}
              and its catalog entry. This cannot be undone.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setProductPendingDelete(null)}
                disabled={productDeleteLoading}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                disabled={productDeleteLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {productDeleteLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Yes, delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {orderPendingDelete ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0a0908]/65 px-4 py-10 backdrop-blur-sm">
          <div className="surface-panel w-full max-w-md rounded-4xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-200">
                  Delete order
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-zinc-50">
                  Remove this order?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => !orderDeleteLoading && setOrderPendingDelete(null)}
                disabled={orderDeleteLoading}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-300">
              This permanently deletes order{" "}
              <span className="font-mono font-semibold text-zinc-50">
                #{orderPendingDelete.orderNumber || "—"}
              </span>
              , including its line items and invoice record. This cannot be undone.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setOrderPendingDelete(null)}
                disabled={orderDeleteLoading}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteOrder}
                disabled={orderDeleteLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {orderDeleteLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Yes, delete order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {emailPendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0908]/65 px-4 py-10 backdrop-blur-sm">
          <div className="surface-panel w-full max-w-md rounded-4xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-200">
                  Delete message
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-zinc-50">
                  Remove this email?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEmailPendingDelete(null)}
                disabled={emailDeleteLoading}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-300">
              This will permanently delete the message from{" "}
              <span className="font-semibold text-zinc-50">
                {emailPendingDelete.name || emailPendingDelete.email || "sender"}
              </span>
              .
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setEmailPendingDelete(null)}
                disabled={emailDeleteLoading}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteEmail}
                disabled={emailDeleteLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {emailDeleteLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Yes, delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {productModalOpen ? (
        <ProductModal
          mode={productModalMode}
          saving={productModalSaving}
          form={productForm}
          setForm={setProductForm}
          onClose={() => {
            if (productModalSaving) return;
            setProductModalOpen(false);
          }}
          onSave={saveProduct}
        />
      ) : null}
    </>
  );
}

function orderItemThumb(products, slug) {
  const p = products.find((x) => String(x?.slug) === String(slug));
  const urls = Array.isArray(p?.gallery) ? p.gallery.filter(Boolean) : [];
  return urls.length ? String(urls[0]).trim() : "";
}

function paymentBadgeTone(paymentStatus) {
  const p = String(paymentStatus || "").toLowerCase();
  if (p === "paid" || p === "authorized") {
    return "border-emerald-500/50 bg-emerald-500/15 text-emerald-200";
  }
  if (p === "refunded") {
    return "border-sky-500/50 bg-sky-500/15 text-sky-200";
  }
  if (p === "failed") {
    return "border-red-500/50 bg-red-500/15 text-red-200";
  }
  return "border-amber-500/50 bg-amber-500/15 text-amber-200";
}

function fulfillmentBadgeTone(status) {
  const s = String(status || "").toLowerCase();
  if (s === "shipped") {
    return "border-sky-500/50 bg-sky-500/15 text-sky-200";
  }
  if (s === "cancelled") {
    return "border-red-500/50 bg-red-500/15 text-red-200";
  }
  if (s === "processing") {
    return "border-violet-500/50 bg-violet-500/15 text-violet-200";
  }
  return "border-zinc-500/50 bg-zinc-500/15 text-zinc-200";
}

function paymentBadgeLabel(paymentStatus) {
  const p = String(paymentStatus || "").toLowerCase();
  if (p === "paid") return "PAID";
  if (p === "authorized") return "AUTHORIZED";
  if (p === "pending") return "PENDING";
  if (p === "failed") return "FAILED";
  if (p === "refunded") return "REFUNDED";
  return String(paymentStatus || "PENDING").toUpperCase() || "PENDING";
}

function fulfillmentBadgeLabel(status) {
  return String(status || "pending").toUpperCase();
}

function CustomerOrdersModal({
  user,
  orders,
  products,
  onClose,
  onRequestDeleteOrder,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const latestFulfillment = formatFulfillmentLabel(user?.latestOrderStatus);
  const items = Array.isArray(orders) ? orders : [];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0a0908]/75 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-orders-title"
      onClick={onClose}
    >
      <div
        className="surface-panel flex max-h-[min(90vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-white/10 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                Customer orders
              </p>
              <h2
                id="customer-orders-title"
                className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-zinc-50 sm:text-3xl"
              >
                {user?.name || "Customer"}
              </h2>
              <p className="mt-2 flex items-center gap-2 truncate text-sm text-zinc-400">
                <Mail className="size-4 shrink-0 text-zinc-500" aria-hidden />
                <span className="truncate">{user?.email || "—"}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-start gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  Last seen
                </p>
                <p className="mt-0.5 text-xs font-semibold text-zinc-200">
                  {formatUserActivityAgo(user, items)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-zinc-500">
                <Package className="size-4 shrink-0" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-wide">
                  Latest status
                </span>
              </div>
              <p className="mt-2 text-sm font-bold capitalize text-zinc-100">
                {latestFulfillment === "—" ? "—" : String(latestFulfillment).toLowerCase()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-zinc-500">
                <CalendarDays className="size-4 shrink-0" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-wide">
                  Total orders
                </span>
              </div>
              <p className="mt-2 text-sm font-bold text-zinc-100">
                {safeNum(user?.orderCount)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-6 pb-2 pt-4 sm:px-8">
          <div>
            <h3 className="font-heading text-lg font-bold text-zinc-50">
              Order history
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Open the store confirmation page for any order.
            </p>
          </div>
          <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {items.length ? (
              items.map((order) => {
                const lineItems = Array.isArray(order?.items) ? order.items : [];
                const n = lineItems.length;
                const total = formatCurrency(safeNum(order?.totals?.total));
                const created = order?.createdAt
                  ? new Date(order.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—";
                const oid = order?._id ? String(order._id) : "";
                return (
                  <article
                    key={oid || order?.orderNumber}
                    className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-bold text-zinc-100">
                          #{order?.orderNumber || "—"}
                        </p>
                        <p className="mt-1 inline-block rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-400">
                          {created}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={cx(
                            "rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
                            paymentBadgeTone(order?.paymentStatus),
                          )}
                        >
                          {paymentBadgeLabel(order?.paymentStatus)}
                        </span>
                        <span
                          className={cx(
                            "rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
                            fulfillmentBadgeTone(order?.status),
                          )}
                        >
                          {fulfillmentBadgeLabel(order?.status)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-zinc-400">
                        {n} line item{n === 1 ? "" : "s"} ·{" "}
                        <span className="font-bold text-zinc-100">{total}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {onRequestDeleteOrder && oid ? (
                          <button
                            type="button"
                            onClick={() => onRequestDeleteOrder(order)}
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-500/35 bg-rose-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-rose-100 transition hover:bg-rose-500/20"
                          >
                            <Trash2 className="size-4" aria-hidden />
                            Delete
                          </button>
                        ) : null}
                        {oid ? (
                          <Link
                            href={`/place-order?orderId=${encodeURIComponent(oid)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-zinc-800"
                          >
                            <DollarSign className="size-4" aria-hidden />
                            Order confirmation →
                          </Link>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                      {lineItems.map((line, idx) => {
                        const thumb = orderItemThumb(products, line?.slug);
                        const title = String(line?.name || "Item").trim() || "Item";
                        const qty = safeNum(line?.quantity);
                        return (
                          <div
                            key={`${line?.slug || idx}-${idx}`}
                            className="flex items-center gap-3"
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-600">
                                  —
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-zinc-100">
                                {title}
                              </p>
                              <p className="text-xs text-zinc-500">Qty {qty}</p>
                            </div>
                            {oid ? (
                              <a
                                href={`/api/orders/${encodeURIComponent(oid)}/invoice`}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
                                aria-label="Open invoice PDF"
                              >
                                <FileText className="size-4" />
                              </a>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-10 text-center text-sm text-zinc-500">
                No orders for this account yet.
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 px-6 py-3 text-center sm:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Admin · orders — open the customer confirmation page
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionShell({ title, subtitle, icon: Icon, headerActions, children }) {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            {Icon ? (
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <Icon className="size-5 text-amber-300" />
              </span>
            ) : null}
            <h2 className="font-heading text-2xl font-extrabold tracking-tighter text-zinc-50 sm:text-3xl">
              {title}
            </h2>
          </div>
          {subtitle ? (
            <p className="mt-2 text-sm text-zinc-300">{subtitle}</p>
          ) : null}
        </div>
        {headerActions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{headerActions}</div>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function InventoryTable({
  rows,
  emptyMessage = "No products found.",
  onRequestDelete,
  onToggleInStock,
  onView,
  onEdit,
  compact = false,
}) {
  const invAct =
    "inline-flex items-center gap-1 rounded-lg border border-stone-800/60 bg-white/[0.03] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-100 transition hover:border-stone-700/70 hover:bg-white/[0.06] active:scale-95";
  const invDanger =
    "inline-flex items-center gap-1 rounded-lg border border-rose-500/35 bg-rose-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-100 transition hover:bg-rose-500/25 active:scale-95";

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-800/60 bg-[#0c0b09]/90 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.75)] ring-1 ring-white/[0.04] backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="bg-white/[0.03]">
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-stone-400">
                Item
              </th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-stone-400">
                Category
              </th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-stone-400">
                Price
              </th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-stone-400">
                Stock
              </th>
              <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-stone-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {rows?.length ? (
              rows.map((p) => {
                const urls = Array.isArray(p?.gallery) ? p.gallery.filter(Boolean) : [];
                const thumb = urls.length ? String(urls[0]).trim() : "";
                const label = String(p?.name || "Product").trim() || "Product";
                return (
                <tr key={p?._id || p?.slug} className="hover:bg-white/[0.03]">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={label}
                          className="h-12 w-12 shrink-0 rounded-xl border border-stone-800/60 bg-[#0a0908] object-contain p-0.5"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-stone-800/60 bg-[#0a0908] text-[10px] font-bold text-stone-500"
                          aria-label={label}
                        >
                          —
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-stone-300">
                    {p?.category || "—"}
                  </td>
                  <td className="px-6 py-4 text-stone-200">
                    {formatCurrency(safeNum(p?.price))}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={cx(
                          "rounded px-2 py-1 text-[10px] font-black uppercase",
                          p?.inStock && safeNum(p?.stockCount) < 5
                            ? "bg-amber-500/15 text-amber-200"
                            : p?.inStock
                              ? "bg-sky-500/15 text-sky-200"
                              : "bg-red-500/15 text-red-200",
                        )}
                      >
                        {p?.inStock && safeNum(p?.stockCount) < 5
                          ? "Low stock"
                          : p?.inStock
                            ? "In stock"
                            : "Out"}
                      </span>
                      <span
                        className={cx(
                          "text-xs font-semibold",
                          safeNum(p?.stockCount) < 5
                            ? "text-rose-300"
                            : "text-stone-300",
                        )}
                      >
                        {safeNum(p?.stockCount)} units
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onView?.(p)}
                        className={invAct}
                      >
                        <Eye className="size-3" />
                        View
                      </button>
                      {compact ? null : (
                        <button
                          type="button"
                          onClick={() => onEdit?.(p)}
                          className={invAct}
                        >
                          <PencilLine className="size-3" />
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onRequestDelete?.(p)}
                        className={invDanger}
                      >
                        <Trash2 className="size-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="px-6 py-10 text-center text-sm text-stone-500"
                  colSpan={5}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductModal({ mode, saving, form, setForm, onClose, onSave }) {
  const readOnly = mode === "view";
  const title =
    mode === "create" ? "Create product" : mode === "edit" ? "Edit product" : "Product details";
  const gallery = Array.isArray(form.gallery) ? form.gallery : [];
  const [uploading, setUploading] = useState(false);
  const [galleryUrlDraft, setGalleryUrlDraft] = useState("");
  const canUpload = !readOnly && !saving && !uploading;
  const canAddUrl =
    canUpload && String(galleryUrlDraft || "").trim().length > 0;

  const categorySelectOptions = useMemo(() => {
    const c = String(form?.category || "").trim();
    if (c && !CATEGORY_OPTIONS.includes(c)) {
      return [c, ...CATEGORY_OPTIONS];
    }
    return CATEGORY_OPTIONS;
  }, [form?.category]);

  const uploadImages = async (fileList) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      fd.append("uploadType", "gallery");

      const res = await fetch("/api/uploads", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Image upload failed.");
        return;
      }
      const urls = Array.isArray(data.files)
        ? data.files.map((x) => x?.url).filter(Boolean)
        : [];
      if (!urls.length) {
        toast.error("No URLs returned from upload.");
        return;
      }
      setForm((p) => ({
        ...p,
        gallery: [...(Array.isArray(p.gallery) ? p.gallery : []), ...urls],
      }));
      toast.success(`${urls.length} image(s) uploaded.`);
    } catch {
      toast.error("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const addGalleryImageByUrl = () => {
    const raw = String(galleryUrlDraft || "").trim();
    if (!raw) {
      toast.error("Enter an image URL.");
      return;
    }
    let normalized;
    try {
      const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      const u = new URL(withProto);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        toast.error("URL must use http:// or https://");
        return;
      }
      normalized = u.href;
    } catch {
      toast.error("That doesn’t look like a valid URL.");
      return;
    }
    const existing = Array.isArray(form.gallery) ? form.gallery : [];
    if (existing.some((u) => String(u).trim() === normalized)) {
      toast.error("That image is already in the gallery.");
      return;
    }
    setForm((p) => ({
      ...p,
      gallery: [...(Array.isArray(p.gallery) ? p.gallery : []), normalized],
    }));
    setGalleryUrlDraft("");
    toast.success("Image URL added.");
  };

  const removeGalleryUrl = async (urlToRemove) => {
    const url = String(urlToRemove || "").trim();
    if (!url) return;
    setForm((p) => ({
      ...p,
      gallery: (Array.isArray(p.gallery) ? p.gallery : []).filter((u) => u !== url),
    }));
    if (!/cloudinary\.com\//i.test(url)) {
      return;
    }
    try {
      await fetch("/api/uploads", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: [url] }),
      });
    } catch {
      // ignore cleanup failures; product can still be saved without the URL
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0908]/75 px-4 py-10 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl max-h-[calc(100svh-4rem)] flex-col overflow-hidden rounded-2xl border border-stone-800/60 bg-[#0c0b09] shadow-2xl ring-1 ring-white/[0.04]">
        <div className="flex shrink-0 items-center justify-between border-b border-stone-800/60 px-6 py-4">
          <h3 className="font-heading text-lg font-extrabold text-stone-50">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-800/60 bg-white/[0.03] text-stone-100 transition hover:border-stone-700/70 hover:bg-white/[0.06] active:scale-95"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
          <Field
            label="Name"
            value={form.name}
            onChange={(v) =>
              setForm((p) => {
                const nextName = v;
                const nextSlug = slugify(nextName);
                return { ...p, name: nextName, slug: nextSlug };
              })
            }
            readOnly={readOnly}
            placeholder="e.g. Hydrating shampoo 300ml"
          />
          <Field
            label="Slug"
            value={form.slug}
            onChange={() => {}}
            readOnly
            placeholder="hydrating-shampoo-300ml"
          />
          <SelectField
            label="Category"
            value={form.category}
            onChange={(v) => setForm((p) => ({ ...p, category: v }))}
            disabled={readOnly}
            options={categorySelectOptions}
          />
          <SelectField
            label="Badge"
            value={form.badge}
            onChange={(v) => setForm((p) => ({ ...p, badge: v }))}
            disabled={readOnly}
            options={["", ...BADGE_OPTIONS]}
            placeholder="None"
          />
          <Field
            label="Current price"
            value={form.price}
            onChange={(v) => setForm((p) => ({ ...p, price: v }))}
            readOnly={readOnly}
            placeholder="84.50"
          />
          <Field
            label="Original price (optional)"
            value={form.compareAtPrice}
            onChange={(v) => setForm((p) => ({ ...p, compareAtPrice: v }))}
            readOnly={readOnly}
            placeholder="Higher than current price to show savings"
          />
          <Field
            label="Stock count"
            value={form.stockCount}
            onChange={(v) => setForm((p) => ({ ...p, stockCount: v }))}
            readOnly={readOnly}
            placeholder="42"
          />
          <p className="sm:col-span-2 text-xs text-stone-500">
            If original price is set above current price, the catalog shows a savings badge
            automatically.
          </p>
          <div className="sm:col-span-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
              <span className="w-full shrink-0 text-[10px] font-bold uppercase leading-none tracking-[0.18em] text-stone-500 sm:w-auto sm:min-w-[11rem]">
                Gallery images (multiple)
              </span>
              {readOnly ? null : (
                <>
                  <label
                    className={cx(
                      "inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-stone-800/60 bg-white/[0.03] px-4 text-[10px] font-black uppercase tracking-widest text-stone-100 transition hover:border-stone-700/70 hover:bg-white/[0.06] active:scale-95",
                      !canUpload ? "cursor-not-allowed opacity-60" : "",
                    )}
                  >
                    <PlusCircle className="size-4 shrink-0" />
                    {uploading ? "Uploading..." : "Upload images"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={!canUpload}
                      className="hidden"
                      onChange={(e) => {
                        uploadImages(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <input
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    placeholder="https://… or paste image URL"
                    value={galleryUrlDraft}
                    onChange={(e) => setGalleryUrlDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addGalleryImageByUrl();
                      }
                    }}
                    disabled={!canUpload}
                    className={cx(
                      "h-10 min-w-0 flex-1 rounded-full border border-stone-700/50 bg-white/[0.04] px-4 text-sm text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-amber-500/35 focus:ring-2 focus:ring-amber-500/20 sm:min-w-[12rem] sm:max-w-md",
                      !canUpload ? "opacity-60" : "",
                    )}
                  />
                  <button
                    type="button"
                    onClick={addGalleryImageByUrl}
                    disabled={!canAddUrl}
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/10 px-4 text-[10px] font-black uppercase tracking-widest text-amber-100 transition hover:border-amber-400/45 hover:bg-amber-500/15 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ExternalLink className="size-4 shrink-0" />
                    Add URL
                  </button>
                </>
              )}
            </div>

            <div className="mt-3 grid gap-2">
              {gallery.length ? (
                <div className="grid max-w-md grid-cols-4 gap-2 sm:max-w-lg sm:grid-cols-5">
                  {gallery.map((url, idx) => (
                    <div
                      key={`${idx}-${url}`}
                      className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-xl border border-stone-800/60 bg-[#0a0908] sm:h-16"
                    >
                      <img
                        src={url}
                        alt={`Uploaded ${idx + 1}`}
                        className="max-h-full max-w-full object-contain p-1"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition group-hover:opacity-100" />
                      {readOnly ? null : (
                        <button
                          type="button"
                          onClick={() => removeGalleryUrl(url)}
                          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/35 bg-rose-500/20 text-rose-100 opacity-0 transition hover:bg-rose-500/30 group-hover:opacity-100"
                          aria-label="Remove image"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                      <div className="absolute bottom-2 left-2 right-2 truncate text-[10px] font-black uppercase tracking-widest text-stone-200 opacity-0 transition group-hover:opacity-100">
                        Image {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-stone-800/60 bg-white/[0.03] px-4 py-3 text-sm text-stone-500">
                  No images yet.
                </div>
              )}
              <p className="text-xs text-stone-500">
                Upload files or paste a direct image URL (https). The first image can be treated as the primary image on the product page.
              </p>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="grid gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                Description
              </span>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                readOnly={readOnly}
                rows={5}
                placeholder="Full product description for the product page and search."
                className={cx(
                  authInputClass,
                  "min-h-[7.5rem] resize-y py-3 text-stone-100",
                )}
              />
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="inline-flex items-center justify-between gap-3 rounded-xl border border-stone-800/60 bg-white/[0.03] px-4 py-3 text-sm text-stone-200">
              <span className="font-semibold text-stone-100">In stock</span>
              <input
                type="checkbox"
                checked={Boolean(form.inStock)}
                onChange={(e) => setForm((p) => ({ ...p, inStock: e.target.checked }))}
                disabled={readOnly}
                className="size-4 accent-amber-500"
              />
            </label>
          </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-stone-800/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={cx(
              storeSecondaryButtonClass,
              "!w-auto px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            Close
          </button>
          {readOnly ? null : (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className={cx(
                authPrimaryButtonClass,
                "!w-auto min-w-[9rem] px-8 py-3.5 disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Shared with Field / SelectField — avoids focus ring + border “double outline” and text clipping from h-11 + py-0 */
const adminModalControlClass =
  "w-full rounded-xl border border-stone-700/50 bg-white/[0.04] px-4 text-sm text-stone-100 outline-none transition placeholder:text-stone-600 " +
  "min-h-[2.75rem] py-2.5 leading-snug read-only:opacity-70 " +
  "focus:border-stone-600/60 focus:outline-none focus:ring-0 " +
  "focus-visible:border-amber-500/40 focus-visible:ring-2 focus-visible:ring-amber-500/20";

function Field({ label, value, onChange, readOnly = false, placeholder = "" }) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className={adminModalControlClass}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  disabled = false,
  options = [],
  placeholder = "Select",
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={cx(
          adminModalControlClass,
          "cursor-pointer pr-9 disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {options.map((opt) => (
          <option key={opt || "__empty__"} value={opt}>
            {opt || placeholder}
          </option>
        ))}
      </select>
    </label>
  );
}

function OrdersTable({
  rows,
  products = [],
  onUpdate,
  onRequestDelete,
  compact = false,
  emptyMessage = "No orders yet.",
}) {
  const toneBadge = (value, type) => {
    const v = String(value || "").toLowerCase();
    if (type === "payment") {
      if (v === "paid") return "bg-emerald-500/15 text-emerald-200";
      if (v === "failed") return "bg-red-500/15 text-red-200";
      return "bg-white/5 text-zinc-200";
    }
    if (type === "status") {
      if (v === "shipped" || v === "delivered") return "bg-sky-500/15 text-sky-200";
      if (v === "processing") return "bg-amber-500/15 text-amber-200";
      if (v === "cancelled") return "bg-red-500/15 text-red-200";
      return "bg-white/5 text-zinc-200";
    }
    return "bg-white/5 text-zinc-200";
  };

  return (
    <div className="space-y-4">
      {rows?.length ? (
        rows.map((o) => {
          const oid = String(o?._id || "");
          const orderNumber = String(o?.orderNumber || "—");
          const placed = o?.createdAt
            ? new Date(o.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "—";
          const payment = String(o?.paymentStatus || "—").toUpperCase();
          const status = String(o?.status || "pending").toUpperCase();
          const statusLower = String(o?.status || "").toLowerCase();
          const isLocked = ["shipped", "delivered"].includes(statusLower);
          const invoiceBase = oid ? `/api/orders/${encodeURIComponent(oid)}/invoice` : "";
          const lineItems = Array.isArray(o?.items) ? o.items : [];

          return (
            <article
              key={oid || orderNumber}
              className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-sm"
            >
              <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.02] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-xs font-black text-zinc-200">
                      #
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-bold tracking-tight text-zinc-50">
                        {orderNumber}
                      </p>
                      <p className="text-xs text-zinc-400">Placed {placed}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {invoiceBase ? (
                    <>
                      <a
                        href={invoiceBase}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-100 transition hover:bg-white/10"
                      >
                        View invoice
                      </a>
                      <a
                        href={`${invoiceBase}?download=1`}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-100 transition hover:bg-white/10"
                      >
                        Download invoice
                      </a>
                    </>
                  ) : null}
                  <span
                    className={cx(
                      "rounded-full border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest",
                      toneBadge(o?.paymentStatus, "payment"),
                    )}
                  >
                    {payment}
                  </span>
                  <span
                    className={cx(
                      "rounded-full border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest",
                      toneBadge(o?.status, "status"),
                    )}
                  >
                    {status}
                  </span>
                </div>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(11rem,1fr)]">
                <section className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Recipient
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-zinc-200">
                    <p className="flex items-center gap-2 font-semibold text-zinc-50">
                      <User className="size-4 text-zinc-500" />
                      <span className="min-w-0 truncate">{o?.customerName || "—"}</span>
                    </p>
                    <p className="flex items-center gap-2 text-zinc-300">
                      <Mail className="size-4 text-zinc-500" />
                      <span className="min-w-0 truncate">{o?.customerEmail || "—"}</span>
                    </p>
                    <p className="flex items-center gap-2 text-zinc-400">
                      <Phone className="size-4 text-zinc-500" />
                      <span className="min-w-0 truncate">{o?.customerPhone || "—"}</span>
                    </p>
                  </div>
                </section>

                <section className="flex min-h-0 min-w-0 flex-col rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      Manifest
                    </p>
                    <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tabular-nums text-zinc-400">
                      {lineItems.length} line{lineItems.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {lineItems.length ? (
                    <ul className="mt-3 max-h-48 min-h-0 space-y-2 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 [scrollbar-gutter:stable] sm:max-h-56">
                      {lineItems.map((line, idx) => {
                        const title =
                          String(line?.name || "Item").trim() || "Item";
                        const qty = Math.max(1, safeNum(line?.quantity));
                        const unit = safeNum(line?.price);
                        const lineTotal = unit * qty;
                        const thumbFromLine = String(line?.image || "").trim();
                        const thumb =
                          thumbFromLine ||
                          orderItemThumb(products, line?.slug);
                        return (
                          <li
                            key={`${String(line?.slug || idx)}-${idx}`}
                            className="flex min-w-0 items-start gap-2.5 rounded-lg border border-white/5 bg-black/20 px-2 py-2"
                          >
                            <div className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/30">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-zinc-500">
                                  <Package className="size-3.5" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <p className="line-clamp-2 break-words text-xs font-semibold leading-snug text-zinc-100">
                                {title}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                                Qty {qty}
                                {qty > 1
                                  ? ` · ${formatCurrency(unit)} each`
                                  : ""}
                              </p>
                            </div>
                            <p className="shrink-0 text-right text-xs font-bold tabular-nums leading-snug text-zinc-200">
                              {formatCurrency(lineTotal)}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-zinc-500">No line items.</p>
                  )}
                </section>

                <section className="flex min-w-0 flex-col justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4 lg:min-w-[11rem]">
                  <div className="min-w-0 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      Total bill
                    </p>
                    <p className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight text-zinc-50">
                      {formatCurrency(safeNum(o?.totals?.total))}
                    </p>
                  </div>

                  <div
                    className={cx(
                      "grid min-w-0 gap-1.5",
                      compact ? "grid-cols-1" : "grid-cols-2",
                    )}
                  >
                    {compact ? null : isLocked ? (
                      <button
                        type="button"
                        disabled
                        className="h-8 min-w-0 w-full rounded-lg border border-white/10 bg-white/5 px-1 text-[10px] font-black uppercase tracking-wider text-zinc-400 opacity-80"
                      >
                        ✓ Shipped
                      </button>
                    ) : (
                      <select
                        className="h-8 min-w-0 w-full rounded-lg border border-white/10 bg-zinc-950 px-1 text-[10px] font-black uppercase tracking-wider text-zinc-100 outline-none focus:ring-1 focus:ring-amber-500/40"
                        value={String(o?.status || "pending")}
                        onChange={(e) => onUpdate?.(o?._id, { status: e.target.value })}
                      >
                        {["pending", "processing", "shipped", "cancelled"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}

                    <Link
                      href={`/place-order?orderId=${encodeURIComponent(oid)}`}
                      className="inline-flex h-8 w-full min-w-0 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-1 text-[10px] font-black uppercase tracking-wider text-zinc-100 transition hover:bg-white/10 active:scale-95"
                    >
                      View
                      <ChevronRight className="size-3.5 shrink-0 opacity-80" />
                    </Link>
                  </div>

                  {onRequestDelete && oid ? (
                    <button
                      type="button"
                      onClick={() => onRequestDelete(o)}
                      className="inline-flex h-8 w-full min-w-0 items-center justify-center gap-1.5 rounded-lg border border-rose-500/35 bg-rose-500/10 px-2 text-[10px] font-black uppercase tracking-wider text-rose-100 transition hover:bg-rose-500/20 active:scale-[0.99]"
                    >
                      <Trash2 className="size-3.5 shrink-0" aria-hidden />
                      Delete order
                    </button>
                  ) : null}
                </section>
              </div>
            </article>
          );
        })
      ) : (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center text-sm text-zinc-500">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

function ReviewStarsDisplay({ rating, sizeClass = "size-3" }) {
  const n = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));
  return (
    <div
      className="flex items-center gap-0.5 text-amber-400"
      role="img"
      aria-label={`${n} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cx(
            sizeClass,
            i <= n ? "fill-current" : "fill-none text-zinc-600",
          )}
        />
      ))}
    </div>
  );
}

function ReviewEditStars({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  const display = disabled ? value : hover > 0 ? hover : value;

  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="radiogroup"
      aria-label="Rating"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => {
            if (!disabled) setHover(star);
          }}
          className="rounded-lg p-0.5 outline-none transition-[transform,opacity] duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          <Star
            size={22}
            strokeWidth={1.5}
            className={cx(
              "transition-colors duration-200",
              display >= star
                ? "fill-amber-400 text-amber-400"
                : "text-zinc-600",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewsTable({
  rows,
  products = [],
  onApprove,
  onReject,
  onRequestDelete,
  onSaveEdit,
}) {
  const editingReviewCardRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [savingId, setSavingId] = useState(null);

  const thumbByProductId = useMemo(() => {
    const m = new Map();
    for (const p of products) {
      const pid = String(p?._id || "");
      if (!pid) continue;
      const urls = Array.isArray(p?.gallery) ? p.gallery.filter(Boolean) : [];
      const url = urls.length ? String(urls[0]).trim() : "";
      if (url) m.set(pid, url);
    }
    return m;
  }, [products]);

  const startEdit = (r) => {
    setEditingId(String(r?._id));
    setEditRating(Math.min(5, Math.max(1, Number(r?.rating) || 5)));
    setEditComment(String(r?.comment || ""));
  };

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setSavingId(null);
  }, []);

  useEffect(() => {
    if (!editingId || savingId) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelEdit();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editingId, savingId, cancelEdit]);

  useEffect(() => {
    if (!editingId) return;
    const id = requestAnimationFrame(() => {
      editingReviewCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [editingId]);

  useEffect(() => {
    if (!editingId) return;
    const stillHere = rows.some((row) => String(row?._id) === editingId);
    if (!stillHere) cancelEdit();
  }, [rows, editingId, cancelEdit]);

  const save = async (id) => {
    setSavingId(id);
    try {
      await onSaveEdit?.(id, editRating, editComment);
      cancelEdit();
    } catch {
      // Error toast handled in parent; stay in edit mode.
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="grid gap-4">
      {rows?.length ? (
        rows.map((r) => {
          const id = r?._id;
          const isEditing = editingId === String(id);
          const slug = String(r?.productSlug || "").trim();
          const pending = String(r?.status) === "pending";
          const thumbUrl = thumbByProductId.get(String(r?.product || "")) || null;
          const productName = String(r?.productName || "—").trim() || "—";
          const createdLabel = r?.createdAt
            ? new Date(r.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "—";

          const productThumb = thumbUrl ? (
            <img
              src={thumbUrl}
              alt={productName}
              className="h-10 w-10 rounded-md border border-white/10 bg-white/5 object-contain p-0.5"
              loading="lazy"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[10px] font-bold text-zinc-500">
              —
            </div>
          );

          return (
            <article
              key={id}
              ref={isEditing ? editingReviewCardRef : undefined}
              className={cx(
                "rounded-4xl border p-4 shadow-sm transition-[box-shadow,background-color,border-color] duration-300 ease-out sm:p-5",
                isEditing
                  ? "border-white/20 bg-white/[0.05] ring-2 ring-amber-500/10 shadow-md"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.04]",
              )}
            >
              <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between sm:px-1">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-zinc-100">
                    {r?.userName || "—"}
                  </p>
                  <p className="truncate text-xs text-zinc-400">{r?.userEmail || "—"}</p>
                </div>
                <span
                  className={cx(
                    "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold",
                    String(r?.status) === "approved"
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                      : String(r?.status) === "rejected"
                        ? "border-amber-500/25 bg-amber-500/10 text-amber-200"
                        : "border-amber-500/25 bg-amber-500/10 text-amber-200",
                  )}
                >
                  {String(r?.status || "pending")}
                </span>
              </div>

              <div className="px-1 pt-4">
                {!isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      <ReviewStarsDisplay rating={r?.rating} sizeClass="size-3" />
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-300">
                      “{String(r?.comment || "—")}”
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-200 shadow-sm transition-all duration-200 hover:bg-white/10 active:scale-[0.98]"
                      >
                        <PencilLine className="size-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onRequestDelete?.(r)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-200 shadow-sm transition-all duration-200 hover:bg-amber-500/15 active:scale-[0.98]"
                        aria-label="Delete review"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-top-1 space-y-4 duration-300 ease-out">
                    <div className="space-y-2">
                      <label
                        htmlFor={`admin-review-comment-${id}`}
                        className="text-xs font-extrabold uppercase tracking-widest text-zinc-400"
                      >
                        Update rating & comment
                      </label>
                      <ReviewEditStars
                        value={editRating}
                        onChange={setEditRating}
                        disabled={savingId === id}
                      />
                    </div>

                    <textarea
                      id={`admin-review-comment-${id}`}
                      rows={3}
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      disabled={savingId === id}
                      className="min-h-22 w-full resize-y rounded-2xl border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-zinc-100 shadow-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                      placeholder="Your feedback..."
                    />

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={savingId === id}
                        className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-200 shadow-sm transition-colors duration-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => save(id)}
                        disabled={savingId === id}
                        className="kinetic-gradient inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-black uppercase tracking-tight text-zinc-950 shadow-sm transition-colors duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === id ? (
                          <>
                            <Loader2
                              className="size-3.5 shrink-0 animate-spin"
                              aria-hidden
                            />
                            Saving…
                          </>
                        ) : (
                          "Save"
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-500">
                      Press{" "}
                      <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-200">
                        Esc
                      </kbd>{" "}
                      to cancel.
                    </p>
                  </div>
                )}
              </div>

              <footer className="mt-4 flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  <span
                    className="inline-flex items-center"
                    aria-label="Product"
                    title="Product"
                  >
                    <Package className="size-4" />
                  </span>
                  {slug ? (
                    <Link
                      href={`/products/${slug}`}
                      className="inline-flex min-w-0 items-center gap-2 font-bold normal-case tracking-normal text-zinc-200 hover:text-amber-200"
                    >
                      {productThumb}
                      <span className="line-clamp-1">{productName}</span>
                    </Link>
                  ) : (
                    <div className="inline-flex min-w-0 items-center gap-2 font-bold normal-case tracking-normal text-zinc-200">
                      {productThumb}
                      <span className="line-clamp-1">{productName}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="text-xs text-zinc-500">{createdLabel}</span>
                  {!isEditing && pending ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onApprove?.(id)}
                        className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/20"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject?.(id)}
                        className="rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-100 transition hover:bg-amber-500/20"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                </div>
              </footer>
            </article>
          );
        })
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-zinc-400">
          No reviews match this filter.
        </div>
      )}
    </div>
  );
}

function RevenueBars({ orders }) {
  const bars = useMemo(() => {
    const paid = Array.isArray(orders)
      ? orders.filter((o) => String(o?.paymentStatus) === "paid")
      : [];
    const totals = paid.map((o) => safeNum(o?.totals?.total)).filter((n) => n > 0);
    const max = Math.max(1, ...totals);
    const slice = totals.slice(0, 12);
    return { slice, max };
  }, [orders]);

  return (
    <>
      <div className="mt-4 flex h-32 items-end gap-1 px-2">
        {bars.slice.length ? (
          bars.slice.map((t, idx) => (
            <div
              key={idx}
              className={cx(
                "flex-1 rounded-t bg-amber-500/20 transition-all hover:bg-amber-500/35",
                idx === 0 ? "bg-amber-500" : null,
              )}
              style={{ height: `${Math.round((t / bars.max) * 100)}%` }}
              title={formatCurrency(t)}
            />
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
            No paid orders yet.
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
        <span>RECENT</span>
        <span className="text-amber-300">PAID</span>
      </div>
    </>
  );
}

function PaymentProviderPie({ orders = [] }) {
  const paidOrders = Array.isArray(orders)
    ? orders.filter((o) => String(o?.paymentStatus || "").toLowerCase() === "paid")
    : [];

  const counts = paidOrders.reduce(
    (acc, o) => {
      const p = String(o?.paymentProvider || "").toLowerCase();
      if (p.includes("stripe")) acc.stripe += 1;
      else if (p.includes("paypal")) acc.paypal += 1;
      else acc.other += 1;
      return acc;
    },
    { stripe: 0, paypal: 0, other: 0 },
  );

  const total = counts.stripe + counts.paypal + counts.other;

  const labels = ["Stripe", "PayPal"];
  const values = [counts.stripe, counts.paypal];
  const colors = ["#22c55e", "#3b82f6"];

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        // Create visual separation between slices.
        borderWidth: 4,
        borderColor: "rgba(24,24,27,1)", // zinc-900-ish, matches card background
        borderRadius: 6,
        spacing: 2,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onHover: (_event, elements, chart) => {
      chart.canvas.style.cursor = elements?.length ? "pointer" : "default";
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = Number(ctx.parsed || 0);
            const pct = total ? Math.round((v / total) * 100) : 0;
            return `${ctx.label}: ${v} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="relative mx-auto h-[160px] w-[160px]">
        <Pie data={data} options={options} />
      </div>

      <div className="space-y-2">
        {[
          { key: "stripe", label: "Stripe", value: counts.stripe, color: colors[0] },
          { key: "paypal", label: "PayPal", value: counts.paypal, color: colors[1] },
        ].map((seg) => {
          const pct = total ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div
              key={seg.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-3 w-3 rounded-full"
                  style={{ backgroundColor: seg.color }}
                  aria-hidden
                />
                <span className="text-sm font-semibold text-zinc-200">
                  {seg.label}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-zinc-50">
                  {seg.value}
                </span>
                <span className="ml-2 text-xs text-zinc-500">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

