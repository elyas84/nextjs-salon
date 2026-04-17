"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  MessageSquare,
  PencilLine,
  Star,
  StarHalf,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

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

function StarRating({ rating = 0, size = "size-3.5" }) {
  const stars = useMemo(() => getStars(rating), [rating]);

  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {stars.map((state, index) => {
        if (state === "full") {
          return (
            <Star
              key={`full-${index}`}
              className={`${size} fill-current`}
            />
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
          <Star
            key={`empty-${index}`}
            className={`${size} text-stone-600`}
          />
        );
      })}
    </div>
  );
}

export default function ProductReviewsSection({
  productId,
  initialReviews = [],
  initialSummary = { averageRating: 0, reviewCount: 0 },
}) {
  const router = useRouter();
  const reviews = initialReviews;
  const summary = initialSummary;
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingReview, setEditingReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data.user || null);
          } else {
            setCurrentUser(null);
          }
          setAuthLoading(false);
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
          setAuthLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;

    const loadMyReviews = async () => {
      try {
        const res = await fetch("/api/reviews/me", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) {
            setMyReview(null);
          }
          return;
        }

        const data = await res.json();
        const nextReview =
          Array.isArray(data.reviews)
            ? data.reviews.find(
                (review) => String(review.product) === String(productId),
              )
            : null;

        if (!cancelled) {
          setMyReview(nextReview || null);
        }
      } catch {
        if (!cancelled) {
          setMyReview(null);
        }
      }
    };

    loadMyReviews();

    return () => {
      cancelled = true;
    };
  }, [currentUser, productId]);

  const startEditing = () => {
    if (!myReview) return;
    setEditingReview(true);
    setRating(myReview.rating || 5);
    setComment(myReview.comment || "");
    setError("");
    setMessage("");
  };

  const cancelEditing = () => {
    setEditingReview(false);
    setRating(myReview?.rating || 5);
    setComment(myReview?.comment || "");
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const isEditing = Boolean(myReview && editingReview);
      const res = await fetch(
        isEditing ? `/api/reviews/${myReview._id}` : `/api/products/${productId}/reviews`,
        {
          method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
          body: JSON.stringify(
            isEditing
              ? { rating, comment, isOwnerEdit: true }
              : { rating, comment },
          ),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit review.");
        setSubmitting(false);
        return;
      }

      const nextReview = data.review || null;
      setMyReview(nextReview);
      setComment("");
      setRating(5);
      setEditingReview(false);
      setMessage(data.message || (isEditing ? "Review updated." : "Review submitted."));
      setSubmitting(false);
      router.refresh();
    } catch {
      setError("Failed to submit review.");
      setSubmitting(false);
    }
  };

  const deleteMyReview = async () => {
    if (!myReview?._id) return;

    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/reviews/${myReview._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete review.");
        setDeleteLoading(false);
        return;
      }

      setMyReview(null);
      setEditingReview(false);
      setRating(5);
      setComment("");
      setDeleteOpen(false);
      setMessage(data.message || "Review deleted.");
      setDeleteLoading(false);
      router.refresh();
    } catch {
      setError("Failed to delete review.");
      setDeleteLoading(false);
    }
  };

  return (
    <section className="mt-12 rounded-3xl border border-stone-800/70 bg-[#0c0b09]/55 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/90">
            Reviews
          </p>
          <h2 className="mt-3 font-heading text-2xl font-semibold text-stone-50">
            What guests are saying
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Reviews are only published after admin approval.
          </p>
        </div>

        <div className="rounded-3xl border border-stone-700/60 bg-stone-950/40 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <StarRating rating={summary.averageRating || 0} size="size-3" />
            <div>
              <p className="text-sm font-semibold text-stone-50">
                {summary.averageRating ? summary.averageRating.toFixed(1) : "0.0"}
              </p>
              <p className="text-xs text-stone-500">
                {summary.reviewCount || 0} approved review{summary.reviewCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-stone-800/70 bg-stone-950/30 p-5 shadow-sm">
          <p className="text-sm font-semibold text-stone-50">Write a review</p>

          {authLoading ? (
            <div className="mt-5 rounded-2xl border border-stone-800/60 bg-black/25 p-4 text-sm text-stone-400">
              Checking your account...
            </div>
          ) : currentUser ? (
            <div className="mt-5 space-y-4">
              {myReview && !editingReview ? (
                <article className="rounded-3xl border border-stone-800/70 bg-black/25 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-stone-50">
                        Your review
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {myReview.productName}
                      </p>
                    </div>
                    <span className="rounded-full border border-stone-700/60 bg-stone-950/50 px-3 py-1 text-[11px] font-semibold text-stone-200 shadow-sm">
                      {myReview.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <StarRating rating={myReview.rating} size="size-3" />
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-300">
                    {myReview.comment}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={startEditing}
                      className="inline-flex items-center gap-2 rounded-xl border border-stone-700/60 bg-stone-950/40 px-4 py-2 text-sm font-semibold text-stone-100 shadow-sm transition-colors hover:bg-stone-900/50"
                    >
                      <PencilLine className="size-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-500/35 bg-red-950/40 px-4 py-2 text-sm font-semibold text-red-200 shadow-sm transition-colors hover:bg-red-950/55"
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </button>
                  </div>
                </article>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {myReview ? (
                    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                      You already submitted a review. You can update it here before
                      it is published.
                    </div>
                  ) : null}

                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                      {editingReview ? "Update your rating" : "Your rating"}
                    </span>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[5, 4, 3, 2, 1].map((value) => {
                        const active = rating === value;

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setRating(value)}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
                              active
                                ? "border-amber-500/50 bg-amber-500/15 text-amber-100"
                                : "border-stone-700/60 bg-stone-950/40 text-stone-200 hover:bg-stone-900/50"
                            }`}
                          >
                            <Star className="size-3 fill-current" />
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                      Comment
                    </span>
                    <textarea
                      rows={5}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Tell other buyers about your experience..."
                      className="w-full rounded-xl border border-stone-700/60 bg-stone-950/40 px-4 py-3 text-sm text-stone-100 shadow-sm outline-none placeholder:text-stone-600 focus:ring-2 focus:ring-amber-500/35"
                    />
                  </label>

                  {error ? (
                    <p className="rounded-2xl border border-red-500/30 bg-red-950/35 px-4 py-3 text-sm text-red-200">
                      {error}
                    </p>
                  ) : null}

                  {message ? (
                    <p className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      {message}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-semibold uppercase tracking-tight text-stone-950 shadow-md shadow-amber-500/15 transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="size-4" />
                          {editingReview ? "Update review" : "Submit review"}
                        </>
                      )}
                    </button>

                    {editingReview ? (
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="inline-flex items-center gap-2 rounded-xl border border-stone-700/60 bg-stone-950/40 px-5 py-3 text-sm font-semibold text-stone-100 shadow-sm transition-colors hover:bg-stone-900/50"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <p className="text-sm leading-6 text-stone-400">
                Please sign in to rate and comment on this product.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-semibold uppercase tracking-tight text-stone-950 shadow-md shadow-amber-500/15 transition-colors hover:brightness-105"
              >
                Sign in to review
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {reviews.length ? (
            reviews.map((review) => (
              <article
                key={review._id}
                className="rounded-3xl border border-stone-800/70 bg-black/25 p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-50">
                      {review.userName}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      Verified buyer
                    </p>
                  </div>
                  <StarRating rating={review.rating} size="size-3" />
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-300">
                  {review.comment}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-700/50 bg-stone-950/25 p-8 text-center text-sm text-stone-400">
              No approved reviews yet. Be the first to share feedback after
              your review is approved.
            </div>
          )}
        </div>
      </div>

      {deleteOpen && myReview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/65 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-stone-800/80 bg-[#0c0b09]/95 p-6 shadow-2xl ring-1 ring-white/[0.06]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/90">
                  Delete review
                </p>
                <h3 className="mt-2 text-xl font-semibold text-stone-50">
                  Remove your review?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-full p-2 text-stone-500 transition-colors hover:bg-white/10 hover:text-stone-100"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-stone-400">
              This will permanently remove your review for{" "}
              <span className="font-semibold text-stone-100">{myReview.productName}</span>.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-xl border border-stone-700/60 bg-stone-950/40 px-5 py-3 text-sm font-semibold text-stone-100 shadow-sm transition-colors hover:bg-stone-900/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteMyReview}
                disabled={deleteLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
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
    </section>
  );
}
