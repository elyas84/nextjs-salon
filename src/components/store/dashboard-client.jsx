"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowRight,
  CalendarDays,
  Tag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Hash,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquare,
  Package,
  PanelLeft,
  PencilLine,
  Settings2,
  ShoppingBag,
  Star,
  StarHalf,
  Trash2,
  User,
  X,
} from "lucide-react";
import Spinner from "@/components/Spinner";
import { bookingRefCode } from "@/lib/booking-ref";
import { formatSlotLabel } from "@/lib/booking-slots";
import { formatLastLogin } from "@/lib/format-last-login";
import { formatCurrency } from "@/lib/store/cart";
import { isUsableImageUrl } from "@/lib/site-hero";
import NoImage from "@/components/ui/NoImage";
import Image from "next/image";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function dashboardTabTitle(tabKey) {
  const labels = {
    overview: "Overview",
    orders: "Orders",
    bookings: "Service bookings",
    reviews: "Reviews",
    profile: "Profile",
  };
  return labels[tabKey] || "Dashboard";
}

function DashboardListPagination({
  ariaLabel,
  countText,
  currentPage,
  totalPages,
  onPrev,
  onNext,
}) {
  return (
    <nav
      className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3"
      aria-label={ariaLabel}
    >
      <p className="text-sm text-zinc-400">{countText}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="inline-flex size-8 items-center justify-center rounded border border-white/10 bg-zinc-900 text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
          Page {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="inline-flex size-8 items-center justify-center rounded border border-white/10 bg-zinc-900 text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  );
}

function getStars(rating) {
  const ratingValue = Math.max(0, Math.min(5, Number(rating) || 0));
  const displayRating = Math.round(ratingValue * 2) / 2;

  return Array.from({ length: 5 }, (_, index) => {
    const starNumber = index + 1;

    if (displayRating >= starNumber) {
      return "full";
    }

    if (displayRating >= starNumber - 0.5) {
      return "half";
    }

    return "empty";
  });
}

function StarRating({ rating = 0, size = "size-4" }) {
  const stars = useMemo(() => getStars(rating), [rating]);

  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {stars.map((state, index) => {
        if (state === "full") {
          return (
            <Star key={`full-${index}`} className={`${size} fill-current`} />
          );
        }

        if (state === "half") {
          return (
            <StarHalf
              key={`half-${index}`}
              className={`${size} fill-current`}
            />
          );
        }

        return (
          <Star key={`empty-${index}`} className={`${size} text-zinc-700`} />
        );
      })}
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
          className="rounded-lg p-0.5 outline-none transition-[transform,opacity] duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          <Star
            size={22}
            strokeWidth={1.5}
            className={`transition-colors duration-200 ${
              display >= star
                ? "fill-amber-400 text-amber-400"
                : "text-zinc-700"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function statusTone(status) {
  switch (status) {
    case "processing":
      return "border-amber-500/25 bg-amber-500/10 text-amber-200";
    case "shipped":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
    case "cancelled":
      return "border-rose-500/25 bg-rose-500/10 text-rose-200";
    default:
      return "border-white/10 bg-white/5 text-zinc-200";
  }
}

const TRACKING_STEPS = [
  { key: "pending", label: "Placed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
];

function trackingIndex(status) {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "shipped" || normalized === "delivered") {
    return 2;
  }
  if (normalized === "processing") {
    return 1;
  }
  return 0;
}

function reviewStatusTone(status) {
  switch (status) {
    case "approved":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
    case "rejected":
      // Fallback if raw status ever appears: show as submitted (rejections are hidden from customers).
      return "border-amber-500/25 bg-amber-500/10 text-amber-200";
    default:
      return "border-amber-500/25 bg-amber-500/10 text-amber-200";
  }
}

function reviewStatusLabel(status) {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Submitted";
    default:
      return "Submitted";
  }
}

function bookingStatusTone(status) {
  switch (String(status || "").toLowerCase()) {
    case "confirmed":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-200";
    case "waitlisted":
      return "border-violet-500/35 bg-violet-500/10 text-violet-200";
    case "completed":
      return "border-sky-500/35 bg-sky-500/10 text-sky-200";
    case "cancelled":
      return "border-red-500/35 bg-red-500/10 text-red-200";
    default:
      return "border-amber-500/35 bg-amber-500/10 text-amber-200";
  }
}

export default function DashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [lastSeenOrdersAt, setLastSeenOrdersAt] = useState(0);
  const [lastSeenReviewsAt, setLastSeenReviewsAt] = useState(0);
  const [lastSeenBookingsAt, setLastSeenBookingsAt] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [savingReviewId, setSavingReviewId] = useState(null);
  const editingReviewCardRef = useRef(null);
  const [reviewPendingDelete, setReviewPendingDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePasswordVisible, setProfilePasswordVisible] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [mobileNavMounted, setMobileNavMounted] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  const readSeenTimestamp = useCallback((key) => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  }, []);

  const writeSeenTimestamp = useCallback((key, value) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, String(Number(value) || 0));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setLastSeenOrdersAt(readSeenTimestamp("ecom:dashboard:lastSeenOrdersAt"));
    setLastSeenReviewsAt(readSeenTimestamp("ecom:dashboard:lastSeenReviewsAt"));
    setLastSeenBookingsAt(readSeenTimestamp("ecom:dashboard:lastSeenBookingsAt"));
  }, [readSeenTimestamp]);

  const loadDashboard = useCallback(async () => {
    const meRes = await fetch("/api/auth/me", { credentials: "include" });
    if (!meRes.ok) {
      router.replace("/login");
      return;
    }

    const meData = await meRes.json();
    if (meData.user?.role === "superadmin") {
      router.replace("/admin");
      return;
    }

    if (meData.user?.role !== "client") {
      router.replace("/login");
      return;
    }

    const [ordersRes, bookingsRes, reviewsRes] = await Promise.all([
      fetch("/api/orders/me", { credentials: "include" }),
      fetch("/api/bookings/me", { credentials: "include" }),
      fetch("/api/reviews/me", { credentials: "include" }),
    ]);

    const ordersData = ordersRes.ok ? await ordersRes.json() : { orders: [] };
    const bookingsData = bookingsRes.ok
      ? await bookingsRes.json()
      : { bookings: [] };
    const reviewsData = reviewsRes.ok
      ? await reviewsRes.json()
      : { reviews: [] };

    setUser(meData.user || null);
    setProfileName(meData.user?.name || "");
    setProfileEmail(meData.user?.email || "");
    setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
    setBookings(
      Array.isArray(bookingsData.bookings) ? bookingsData.bookings : [],
    );
    setReviews(Array.isArray(reviewsData.reviews) ? reviewsData.reviews : []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await loadDashboard();
      } catch {
        if (!cancelled) {
          toast.error("Failed to load dashboard.");
          setLoading(false);
        }
      }
    };

    if (typeof queueMicrotask === "function") {
      queueMicrotask(run);
    } else {
      const timeoutId = window.setTimeout(run, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(timeoutId);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [loadDashboard]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setEditingReviewId(null);
        setReviewPendingDelete(null);
        setDeleteAccountModalOpen(false);
        setLogoutModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (activeTab === "orders") {
      setOrderPage(1);
    }
    if (activeTab === "bookings") {
      setBookingPage(1);
    }
  }, [activeTab]);

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

  const orderUpdatesCount = useMemo(() => {
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
      const eventAt = Math.max(updatedAt, historyAt || 0);
      const isUpdate = eventAt > createdAt;
      if (!isUpdate) return count;
      if (eventAt <= lastSeenOrdersAt) return count;
      return count + 1;
    }, 0);
  }, [orders, lastSeenOrdersAt]);

  const reviewDecisionCount = useMemo(() => {
    return reviews.reduce((count, review) => {
      const status = String(review?.status || "").toLowerCase();
      if (status !== "approved") return count;
      const updatedAt = new Date(review?.updatedAt || 0).getTime() || 0;
      const createdAt = new Date(review?.createdAt || 0).getTime() || 0;
      const eventAt = Math.max(updatedAt, createdAt);
      if (eventAt <= lastSeenReviewsAt) return count;
      return count + 1;
    }, 0);
  }, [reviews, lastSeenReviewsAt]);

  const bookingUpdatesCount = useMemo(() => {
    return bookings.reduce((count, b) => {
      const createdAt = new Date(b?.createdAt || 0).getTime() || 0;
      const updatedAt = new Date(b?.updatedAt || 0).getTime() || 0;
      const eventAt = Math.max(updatedAt, createdAt);
      const isUpdate = updatedAt > createdAt;
      if (!isUpdate) return count;
      if (eventAt <= lastSeenBookingsAt) return count;
      return count + 1;
    }, 0);
  }, [bookings, lastSeenBookingsAt]);

  useEffect(() => {
    if (activeTab === "orders") {
      const nextSeen = Math.max(Date.now(), latestOrderEventAt || 0);
      setLastSeenOrdersAt(nextSeen);
      writeSeenTimestamp("ecom:dashboard:lastSeenOrdersAt", nextSeen);
    }

    if (activeTab === "reviews") {
      const nextSeen = Math.max(Date.now(), latestReviewEventAt || 0);
      setLastSeenReviewsAt(nextSeen);
      writeSeenTimestamp("ecom:dashboard:lastSeenReviewsAt", nextSeen);
    }

    if (activeTab === "bookings") {
      const nextSeen = Math.max(Date.now(), latestBookingEventAt || 0);
      setLastSeenBookingsAt(nextSeen);
      writeSeenTimestamp("ecom:dashboard:lastSeenBookingsAt", nextSeen);
    }
  }, [
    activeTab,
    latestOrderEventAt,
    latestReviewEventAt,
    latestBookingEventAt,
    writeSeenTimestamp,
  ]);

  const stats = useMemo(() => {
    const totalSpend = orders.reduce(
      (sum, order) => sum + Number(order.totals?.total || 0),
      0,
    );

    return {
      orders: orders.length,
      activeOrders: orders.filter((order) =>
        ["pending", "processing"].includes(
          String(order.status || "").toLowerCase(),
        ),
      ).length,
      shippedOrders: orders.filter((order) => {
        const s = String(order.status || "").toLowerCase();
        return s === "shipped" || s === "delivered";
      }).length,
      bookings: bookings.length,
      reviews: reviews.length,
      pendingReviews: reviews.filter((review) => {
        const s = String(review.status || "").toLowerCase();
        return s === "pending" || s === "rejected";
      }).length,
      approvedReviews: reviews.filter((review) => review.status === "approved")
        .length,
      totalSpend,
    };
  }, [orders, reviews, bookings]);

  const ORDERS_PER_PAGE = 3;
  const BOOKINGS_PER_PAGE = 3;

  const totalOrderPages = useMemo(
    () => Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE)),
    [orders.length],
  );
  const currentOrderPage = useMemo(
    () => Math.min(orderPage, totalOrderPages),
    [orderPage, totalOrderPages],
  );
  const paginatedOrders = useMemo(
    () =>
      orders.slice(
        (currentOrderPage - 1) * ORDERS_PER_PAGE,
        currentOrderPage * ORDERS_PER_PAGE,
      ),
    [currentOrderPage, orders],
  );

  const totalBookingPages = useMemo(
    () => Math.max(1, Math.ceil(bookings.length / BOOKINGS_PER_PAGE)),
    [bookings.length],
  );
  const currentBookingPage = useMemo(
    () => Math.min(bookingPage, totalBookingPages),
    [bookingPage, totalBookingPages],
  );
  const paginatedBookings = useMemo(
    () =>
      bookings.slice(
        (currentBookingPage - 1) * BOOKINGS_PER_PAGE,
        currentBookingPage * BOOKINGS_PER_PAGE,
      ),
    [bookings, currentBookingPage],
  );

  const sidebarTabs = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "orders", label: "Orders", icon: ShoppingBag },
    { key: "bookings", label: "Service bookings", icon: CalendarDays },
    { key: "reviews", label: "Reviews", icon: MessageSquare },
    { key: "profile", label: "Profile", icon: Settings2 },
  ];

  const userInitials = useMemo(() => {
    const n = String(user?.name || user?.email || "C").trim() || "C";
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
    }
    return n.slice(0, 2).toUpperCase();
  }, [user?.name, user?.email]);

  const editReview = (review) => {
    setEditingReviewId(review._id);
    setEditRating(review.rating || 5);
    setEditComment(review.comment || "");
  };

  const cancelEdit = useCallback(() => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment("");
  }, []);

  useEffect(() => {
    if (!editingReviewId || savingReviewId) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelEdit();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editingReviewId, savingReviewId, cancelEdit]);

  useEffect(() => {
    if (!editingReviewId) return;
    const id = requestAnimationFrame(() => {
      editingReviewCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [editingReviewId]);

  const saveReview = async (reviewId) => {
    if (savingReviewId) return;

    setSavingReviewId(reviewId);

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          isOwnerEdit: true,
          rating: editRating,
          comment: editComment,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update review.");
        return;
      }

      toast.success(data.message || "Review updated.");
      cancelEdit();
      await loadDashboard();
    } catch {
      toast.error("Failed to update review.");
    } finally {
      setSavingReviewId(null);
    }
  };

  const confirmDeleteReview = async () => {
    if (!reviewPendingDelete?._id) return;

    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/reviews/${reviewPendingDelete._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete review.");
        return;
      }

      toast.success(data.message || "Review deleted.");
      setReviewPendingDelete(null);
      if (editingReviewId === reviewPendingDelete._id) {
        cancelEdit();
      }
      await loadDashboard();
    } catch {
      toast.error("Failed to delete review.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const payload = {
        name: profileName,
        email: profileEmail,
      };

      if (currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error("New passwords do not match.");
          setSavingProfile(false);
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
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update profile.");
        setSavingProfile(false);
        return;
      }

      setUser(data.user || user);
      setProfileName(data.user?.name || profileName);
      setProfileEmail(data.user?.email || profileEmail);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(data.message || "Profile updated.");
      window.dispatchEvent(new Event("auth-changed"));
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const deleteAccount = async () => {
    setDeleteAccountLoading(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete account.");
        setDeleteAccountLoading(false);
        return;
      }

      toast.success(data.message || "Account deleted.");
      window.dispatchEvent(new Event("auth-changed"));
      router.replace("/register");
    } catch {
      toast.error("Failed to delete account.");
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const confirmLogout = async () => {
    setLogoutLoading(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      window.dispatchEvent(new Event("auth-changed"));
      router.replace("/login");
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-[calc(100svh-160px)] bg-[#0a0908] text-stone-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(245,158,11,0.07),transparent_50%)]" />
        <main className="relative z-10 flex min-h-[calc(100svh-160px)] items-center justify-center px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Spinner />
            <div className="rounded-2xl border border-stone-800/60 bg-[#0c0b09]/90 px-6 py-4 text-sm font-semibold text-stone-200 ring-1 ring-white/[0.04] backdrop-blur-xl">
              Loading your dashboard…
            </div>
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
                      Your account
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
                      {userInitials}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                      <p
                        className="truncate text-sm font-semibold text-zinc-100"
                        title={user?.name || undefined}
                      >
                        {user?.name || "Customer"}
                      </p>
                      <p
                        className="truncate text-xs text-zinc-500"
                        title={user?.email || undefined}
                      >
                        {user?.email || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="mt-0 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]">
                {sidebarTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.key;
                  const badgeCount =
                    tab.key === "orders"
                      ? orderUpdatesCount
                      : tab.key === "reviews"
                        ? reviewDecisionCount
                        : tab.key === "bookings"
                          ? bookingUpdatesCount
                          : 0;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={() => setActiveTab(tab.key)}
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
                          {tab.label}
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
                  onClick={() => setLogoutModalOpen(true)}
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
                    aria-label="Open dashboard navigation"
                  >
                    <PanelLeft className="size-5" strokeWidth={1.75} />
                  </button>
                  <span className="hidden min-w-0 truncate sm:inline text-xs font-semibold text-zinc-300">
                    {dashboardTabTitle(activeTab)}
                  </span>
                </div>
                <div className="hidden min-w-0 md:flex md:max-w-[14rem] md:flex-col md:justify-center md:pr-2 lg:max-w-xs">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/90">
                    Account
                  </span>
                  <span className="truncate font-heading text-lg font-bold tracking-tight text-zinc-50">
                    {dashboardTabTitle(activeTab)}
                  </span>
                </div>
              </div>
            </header>

          {mobileNavMounted ? (
            <div
              className="fixed inset-0 z-[90] md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard navigation"
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
                        YOUR ACCOUNT
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
                      {userInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-100">
                        {user?.name || "Dashboard"}
                      </p>
                      <p className="mt-1 truncate text-xs leading-relaxed text-zinc-500">
                        {user?.email || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <nav className="mt-7 space-y-2.5">
                  {sidebarTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.key;
                    const badgeCount =
                      tab.key === "orders"
                        ? orderUpdatesCount
                        : tab.key === "reviews"
                          ? reviewDecisionCount
                          : tab.key === "bookings"
                            ? bookingUpdatesCount
                            : 0;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.key);
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
                            {tab.label}
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
                      setLogoutModalOpen(true);
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
          {activeTab === "overview" ? (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* 1. Hero Welcome Section */}
              <div className="surface-panel relative overflow-hidden rounded-[2.5rem] p-8 lg:p-12">
                <div className="absolute -right-20 -top-20 size-80 rounded-full bg-amber-500/10 blur-[100px]" />

                <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-300">
                        Client account
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-zinc-200 shadow-sm">
                        Last login • {formatLastLogin(user?.lastLogin)}
                      </span>
                    </div>

                    <h1 className="mt-4 font-heading text-4xl font-extrabold tracking-tighter text-zinc-50 sm:text-5xl">
                      Welcome back,{" "}
                      <span className="text-zinc-50">
                        {user?.name?.split(" ")[0] || "Customer"}
                      </span>
                    </h1>

                    <p className="mt-4 text-base leading-relaxed text-zinc-300">
                      Everything you need in one place. Track orders, manage
                      your reviews, and keep your profile up to date.
                    </p>
                  </div>

                  <Link
                    href="/products"
                    className="group inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.08] px-6 py-4 text-sm font-black uppercase tracking-tight text-zinc-50 shadow-sm transition-colors hover:border-white/25 hover:bg-white/[0.12] active:scale-95"
                  >
                    Explore catalog
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* 2. Stats Grid — six cards on wide screens */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                {[
                  {
                    label: "Orders",
                    value: stats.orders,
                    icon: ShoppingBag,
                    color: "text-blue-400",
                  },
                  {
                    label: "Active",
                    value: stats.activeOrders,
                    icon: Clock3,
                    color: "text-amber-300",
                  },
                  {
                    label: "Shipped",
                    value: stats.shippedOrders,
                    icon: CheckCircle2,
                    color: "text-emerald-400",
                  },
                  {
                    label: "Bookings",
                    value: stats.bookings,
                    icon: CalendarDays,
                    color: "text-cyan-400",
                  },
                  {
                    label: "Reviews",
                    value: stats.reviews,
                    icon: MessageSquare,
                    color: "text-purple-400",
                  },
                  {
                    label: "Spend",
                    value: formatCurrency(stats.totalSpend),
                    icon: Package,
                    color: "text-amber-400",
                  },
                ].map((card) => {
                  const Icon = card.icon;

                  return (
                    <article
                      key={card.label}
                      className="surface-panel group relative overflow-hidden rounded-4xl p-6 transition-colors hover:border-white/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-zinc-400">
                          {card.label}
                        </span>
                        <div
                          className={`rounded-lg border border-white/10 bg-white/5 p-2 ${card.color} transition-colors group-hover:bg-white/10`}
                        >
                          <Icon className="size-4" />
                        </div>
                      </div>
                      <p className="mt-4 text-2xl font-extrabold tracking-tight text-zinc-50">
                        {card.value}
                      </p>
                    </article>
                  );
                })}
              </div>

              {/* 3. Bottom Utility/Note Section */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="surface-panel rounded-4xl p-6 lg:p-8">
                  <div className="flex items-center gap-3 text-zinc-50">
                    <Clock3 className="size-4" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest">
                      Navigation Hint
                    </h4>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                    Use the navigation menu for orders, service bookings, and
                    reviews. Your profile settings are available to manage your
                    addresses and contact info.
                  </p>
                </div>

                {/* Optional: Add a small "Need help" card or promo here */}
                <div className="hidden items-center justify-center rounded-4xl border border-dashed border-white/15 bg-white/5 p-6 lg:flex">
                  <p className="text-xs text-zinc-400">
                    New features and exclusive rewards coming soon.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === "orders" ? (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
              {/* Header Section */}
              <div className="surface-panel flex flex-col gap-2 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-300">
                    Order History
                  </p>
                  <h2 className="text-xl font-extrabold text-zinc-50">
                    Your Recent Orders
                  </h2>
                </div>
                <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-200">
                  {orders.length} {orders.length === 1 ? "Record" : "Records"}{" "}
                  found
                </p>
              </div>

              {orders.length > ORDERS_PER_PAGE ? (
                <DashboardListPagination
                  ariaLabel="Order list pages"
                  countText={`${orders.length} order${orders.length === 1 ? "" : "s"}`}
                  currentPage={currentOrderPage}
                  totalPages={totalOrderPages}
                  onPrev={() =>
                    setOrderPage((prev) => Math.max(1, prev - 1))
                  }
                  onNext={() =>
                    setOrderPage((prev) =>
                      Math.min(totalOrderPages, prev + 1),
                    )
                  }
                />
              ) : null}

              <div className="space-y-4">
                {orders.length ? (
                  paginatedOrders.map((order) => {
                    const normalizedStatus = String(
                      order.status || "pending",
                    ).toLowerCase();
                    const isCancelled = normalizedStatus === "cancelled";
                    const currentTrackingIndex =
                      trackingIndex(normalizedStatus);

                    return (
                      <article
                        key={order._id}
                        className="group rounded-4xl border border-white/10 bg-white/5 shadow-sm transition-colors hover:bg-white/7"
                      >
                        {/* 1. Upper Div: Order ID & Status */}
                        <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-200">
                              <Hash size={14} />
                            </div>
                            <div>
                              <span className="text-xs font-extrabold tracking-widest text-zinc-50 uppercase">
                                {order.orderNumber}
                              </span>
                              <p className="text-xs text-zinc-400">
                                {new Date(order.createdAt).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`/api/orders/${order._id}/invoice`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-white/10"
                            >
                              View invoice
                            </a>
                            <a
                              href={`/api/orders/${order._id}/invoice?download=1`}
                              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-white/10"
                            >
                              Download invoice
                            </a>
                          <div
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}
                          >
                            {order.status}
                          </div>
                          </div>
                        </div>

                        {/* 2. Content Area */}
                        <div className="p-6">
                          {/* Scrollable Product List */}
                          <div className="space-y-1">
                            <p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                              Items Manifest
                            </p>

                            {/* Scroll Container */}
                            <div className="max-h-44 space-y-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                              {order.items?.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 transition-colors group-hover:bg-black/30"
                                >
                                  <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                    {item.image &&
                                    isUsableImageUrl(String(item.image).trim()) ? (
                                      <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        sizes="40px"
                                        className="object-cover"
                                      />
                                    ) : (
                                      <NoImage
                                        thumbnail
                                        tone="zinc"
                                        className="rounded-xl border-white/10"
                                      />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-semibold text-zinc-50">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                      Qty: {item.quantity} •{" "}
                                      {formatCurrency(item.price || 0)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Tracking Timeline */}
                          <div className="mt-8 px-2">
                            {isCancelled ? (
                              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-center text-xs font-semibold text-amber-200">
                                Transaction Cancelled
                              </div>
                            ) : (
                              <div className="relative pt-2">
                                <div className="absolute top-1.25 left-0 h-0.5 w-full bg-white/10" />
                                <div
                                  className="absolute top-1.25 left-0 h-0.5 bg-amber-500 transition-all duration-1000"
                                  style={{
                                    width: `${(currentTrackingIndex / (TRACKING_STEPS.length - 1)) * 100}%`,
                                  }}
                                />
                                <div className="relative flex justify-between">
                                  {TRACKING_STEPS.map((step, index) => {
                                    const isDone =
                                      currentTrackingIndex >= index;
                                    const isCurrent =
                                      currentTrackingIndex === index;
                                    return (
                                      <div
                                        key={step.key}
                                        className="flex flex-col items-center"
                                      >
                                        <div
                                          className={`z-10 size-2.5 rounded-full border-2 transition-all duration-500 ${isDone ? "border-amber-500 bg-zinc-950 scale-110" : "border-white/20 bg-zinc-950"} ${isCurrent ? "ring-4 ring-amber-500/15" : ""}`}
                                        />
                                        <span
                                          className={`mt-3 text-[10px] font-semibold uppercase tracking-tight ${isDone ? "text-zinc-50" : "text-zinc-500"}`}
                                        >
                                          {step.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 3. Footer Summary */}
                        <div className="flex flex-col gap-4 rounded-b-4xl border-t border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                          <div className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-amber-500/70" />
                            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
                              {order.delivery === "express"
                                ? "Express Delivery"
                                : "Standard Post"}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                              Amount Paid
                            </p>
                            <p className="text-lg font-extrabold text-zinc-50 tracking-tight">
                              {formatCurrency(order.totals?.total || 0)}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-white/15 bg-white/5 py-16">
                    <Package className="mb-4 size-8 text-zinc-500" />
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-zinc-400">
                      No Orders Found
                    </p>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "bookings" ? (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
              <div className="surface-panel flex flex-col gap-2 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-300">
                    Workshop
                  </p>
                  <h2 className="text-xl font-extrabold text-zinc-50">
                    Your service bookings
                  </h2>
                </div>
                <Link
                  href="/book-a-service"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-5 py-3 text-xs font-black uppercase tracking-tight text-zinc-50 shadow-sm transition-colors hover:border-white/25 hover:bg-white/[0.12]"
                >
                  New booking <ArrowRight className="size-4" />
                </Link>
              </div>

              {bookings.length > BOOKINGS_PER_PAGE ? (
                <DashboardListPagination
                  ariaLabel="Service booking list pages"
                  countText={`${bookings.length} booking${bookings.length === 1 ? "" : "s"}`}
                  currentPage={currentBookingPage}
                  totalPages={totalBookingPages}
                  onPrev={() =>
                    setBookingPage((prev) => Math.max(1, prev - 1))
                  }
                  onNext={() =>
                    setBookingPage((prev) =>
                      Math.min(totalBookingPages, prev + 1),
                    )
                  }
                />
              ) : null}

              <div className="space-y-4">
                {bookings.length ? (
                  paginatedBookings.map((b) => {
                    const pdfBase = `/api/bookings/${encodeURIComponent(String(b._id))}/pdf`;
                    const ref = bookingRefCode(b);
                    return (
                    <article
                      key={b._id}
                      className="overflow-hidden rounded-4xl border border-white/10 bg-white/5 shadow-sm"
                    >
                      <header className="flex flex-col gap-4 border-b border-white/10 bg-black/20 p-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-bold tracking-tight text-zinc-400">
                            #{ref}
                          </p>
                          <p className="mt-1 text-lg font-extrabold tracking-tight text-zinc-50">
                            {b.serviceType}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-200">
                              <User className="size-3.5 text-zinc-500" aria-hidden />
                              {b.fullName}
                            </span>
                            {b.registrationNumber ? (
                              <span className="inline-flex items-center gap-1.5 font-medium text-zinc-300">
                                <Tag className="size-3.5 shrink-0 text-zinc-500" aria-hidden />
                                {String(b.registrationNumber).trim()}
                              </span>
                            ) : null}
                          </p>
                        </div>

                        <div className="flex flex-col items-stretch gap-2 sm:items-end">
                          <span
                            className={cx(
                              "self-start rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide sm:self-end",
                              bookingStatusTone(b.status),
                            )}
                          >
                            {String(b.status || "pending")}
                          </span>
                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            <a
                              href={pdfBase}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-200 transition hover:bg-white/10"
                            >
                              <FileText className="size-3.5" />
                              View PDF
                            </a>
                            <a
                              href={`${pdfBase}?download=1`}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-200 transition hover:bg-white/10"
                            >
                              <Download className="size-3.5" />
                              Download
                            </a>
                          </div>
                        </div>
                      </header>

                      <div className="p-5">
                        <dl className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              Preferred date
                            </dt>
                            <dd className="mt-1 inline-flex items-center gap-1.5 font-semibold text-zinc-200">
                              <CalendarDays className="size-3.5 text-zinc-500" />
                              {b.preferredDate
                                ? new Date(
                                    `${b.preferredDate}T12:00:00`,
                                  ).toLocaleDateString(undefined, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "—"}
                            </dd>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              Preferred time
                            </dt>
                            <dd className="mt-1 inline-flex items-center gap-1.5 font-semibold text-zinc-200">
                              <Clock3 className="size-3.5 text-zinc-500" />
                              {b.preferredTime ? formatSlotLabel(b.preferredTime) : "—"}
                            </dd>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              Requested
                            </dt>
                            <dd className="mt-1 font-semibold text-zinc-200">
                              {b.createdAt
                                ? new Date(b.createdAt).toLocaleString(
                                    undefined,
                                    {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    },
                                  )
                                : "—"}
                            </dd>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                              Phone
                            </dt>
                            <dd className="mt-1 font-semibold text-zinc-200">
                              {b.phone || "—"}
                            </dd>
                          </div>
                        </dl>

                        {b.notes ? (
                          <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-relaxed text-zinc-400">
                            {b.notes}
                          </p>
                        ) : null}
                      </div>
                    </article>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-white/15 bg-white/5 px-6 py-16">
                    <CalendarDays className="mb-4 size-8 text-zinc-500" />
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-zinc-400">
                      No bookings yet
                    </p>
                    <Link
                      href="/book-a-service"
                      className="mt-6 text-sm font-semibold text-amber-400 underline-offset-2 hover:underline"
                    >
                      Schedule a service
                    </Link>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "reviews" ? (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
              {/* Header */}
              <div className="surface-panel flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-300">
                    Feedback
                  </p>
                  <h2 className="text-xl font-extrabold text-zinc-50">
                    Your Reviews
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                  {stats.pendingReviews} submitted
                </div>
              </div>

              <div className="space-y-3">
                {reviews.length ? (
                  reviews.map((review) => {
                    const isEditing = editingReviewId === review._id;

                    return (
                      <article
                        key={review._id}
                        ref={isEditing ? editingReviewCardRef : undefined}
                        className={`group rounded-4xl border shadow-sm transition-[box-shadow,background-color,border-color] duration-300 ease-out ${
                          isEditing
                            ? "border-white/20 bg-white/7 ring-2 ring-amber-500/10 shadow-md"
                            : "border-white/10 bg-white/5 hover:bg-white/7"
                        }`}
                      >
                        {/* Upper Div: Product Header */}
                        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-zinc-300 transition-colors">
                              <Package size={16} />
                            </div>
                            <Link
                              href={`/products/${review.productSlug}`}
                              className="text-sm font-semibold text-zinc-50 transition-colors hover:text-white"
                            >
                              {review.productName}
                            </Link>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${reviewStatusTone(review.status)}`}
                          >
                            {reviewStatusLabel(review.status)}
                          </span>
                        </div>

                        {/* Lower Div: Content Area */}
                        <div className="p-4 sm:px-6">
                          {!isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-0.5 text-amber-500">
                                <StarRating
                                  rating={review.rating}
                                  size="size-3"
                                />
                              </div>
                              <p className="text-sm leading-relaxed text-slate-600">
                                <span aria-hidden>&ldquo;</span>
                                {review.comment}
                                <span aria-hidden>&rdquo;</span>
                              </p>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => editReview(review)}
                                  className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-200 shadow-sm transition-all duration-200 hover:bg-white/10 active:scale-[0.98]"
                                >
                                  <PencilLine size={12} />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReviewPendingDelete(review)}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-200 shadow-sm transition-all duration-200 hover:bg-amber-500/15 active:scale-[0.98]"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-300 ease-out space-y-4">
                              <div className="space-y-2">
                                <label
                                  htmlFor={`review-comment-${review._id}`}
                                  className="text-xs font-extrabold uppercase tracking-widest text-zinc-400"
                                >
                                  Update rating & comment
                                </label>
                                <ReviewEditStars
                                  value={editRating}
                                  onChange={setEditRating}
                                  disabled={
                                    savingReviewId === review._id
                                  }
                                />
                              </div>

                              <textarea
                                id={`review-comment-${review._id}`}
                                rows={3}
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                                disabled={savingReviewId === review._id}
                                className="min-h-22 w-full resize-y rounded-2xl border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-zinc-100 shadow-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                                placeholder="Your feedback..."
                              />

                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  disabled={savingReviewId === review._id}
                                  className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-200 shadow-sm transition-colors duration-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveReview(review._id)}
                                  disabled={savingReviewId === review._id}
                                  className="kinetic-gradient inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-black uppercase tracking-tight text-zinc-950 shadow-sm transition-colors duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {savingReviewId === review._id ? (
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
                              <p className="text-[11px] leading-relaxed text-slate-500">
                                Press{" "}
                                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-200">
                                  Esc
                                </kbd>{" "}
                                to cancel.
                              </p>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-white/15 bg-white/5 py-10">
                    <p className="text-xs font-extrabold text-zinc-400 uppercase tracking-[0.2em]">
                      Empty Feed
                    </p>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "profile" ? (
            <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <form
                onSubmit={updateProfile}
                className="surface-panel rounded-4xl p-6 sm:p-8"
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-300">
                  Profile
                </p>
                <h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tighter text-zinc-50">
                  Update your account
                </h2>

                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                      Name
                    </span>
                    <input
                      value={profileName}
                      onChange={(event) => setProfileName(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 shadow-sm outline-none transition placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500/30"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                      Email
                    </span>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(event) => setProfileEmail(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 shadow-sm outline-none transition placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500/30"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                        Current password
                      </span>
                      <div className="relative">
                        <input
                          type={
                            profilePasswordVisible.current ? "text" : "password"
                          }
                          value={currentPassword}
                          onChange={(event) =>
                            setCurrentPassword(event.target.value)
                          }
                          autoComplete="current-password"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-zinc-100 shadow-sm outline-none transition focus:ring-2 focus:ring-amber-500/30"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProfilePasswordVisible((prev) => ({
                              ...prev,
                              current: !prev.current,
                            }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 transition-colors hover:text-white"
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
                      <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                        New password
                      </span>
                      <div className="relative">
                        <input
                          type={profilePasswordVisible.new ? "text" : "password"}
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          autoComplete="new-password"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-zinc-100 shadow-sm outline-none transition focus:ring-2 focus:ring-amber-500/30"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProfilePasswordVisible((prev) => ({
                              ...prev,
                              new: !prev.new,
                            }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 transition-colors hover:text-white"
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
                    <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                      Confirm new password
                    </span>
                    <div className="relative">
                      <input
                        type={
                          profilePasswordVisible.confirm ? "text" : "password"
                        }
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-zinc-100 shadow-sm outline-none transition focus:ring-2 focus:ring-amber-500/30"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setProfilePasswordVisible((prev) => ({
                            ...prev,
                            confirm: !prev.confirm,
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 transition-colors hover:text-white"
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
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-5 text-sm font-black uppercase tracking-tight text-zinc-50 shadow-sm transition-colors hover:border-white/25 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {savingProfile ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteAccountModalOpen(true)}
                    className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-5 text-sm font-semibold text-amber-200 shadow-sm transition-colors hover:bg-amber-500/15 sm:w-auto"
                  >
                    <Trash2 className="size-4 shrink-0" />
                    Delete account
                  </button>
                </div>
              </form>

              <aside className="space-y-6">
                <section className="surface-panel rounded-4xl p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-300">
                    Account notes
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    Update your contact details or password here. Deleting your
                    account removes your login access immediately.
                  </p>
                </section>
              </aside>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  </div>

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
                className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-300">
              This will permanently delete your review for{" "}
              <span className="font-semibold text-zinc-50">
                {reviewPendingDelete.productName}
              </span>
              .
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setReviewPendingDelete(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteReview}
                disabled={deleteLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteLoading ? (
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

      {deleteAccountModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0908]/65 px-4 py-10 backdrop-blur-sm"
          onClick={() => {
            if (!deleteAccountLoading) {
              setDeleteAccountModalOpen(false);
            }
          }}
        >
          <div
            className="surface-panel w-full max-w-md rounded-4xl p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-200">
                  Delete account
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-zinc-50">
                  Remove your account?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDeleteAccountModalOpen(false)}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-300">
              This will delete your login and remove access to your dashboard.
              Any past order records may remain in the store records.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setDeleteAccountModalOpen(false)}
                disabled={deleteAccountLoading}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteAccount}
                disabled={deleteAccountLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteAccountLoading ? (
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

      {logoutModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0908]/65 px-4 backdrop-blur-sm"
          onClick={() => {
            if (!logoutLoading) setLogoutModalOpen(false);
          }}
        >
          <div
            className="surface-panel w-full max-w-sm rounded-[1.75rem] p-5 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-200">
                <X className="size-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-300">
                  Confirm logout
                </p>
                <h3 className="mt-2 text-xl font-extrabold text-zinc-50">
                  Sign out of your account?
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  You will need to log in again to view your orders, reviews,
                  and profile settings.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                disabled={logoutLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                disabled={logoutLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {logoutLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  "Yes, log out"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
