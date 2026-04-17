import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import Review from "@/lib/models/Review";

const normalizeReview = (review) => ({
  _id: String(review._id),
  product: String(review.product || ""),
  productSlug: String(review.productSlug || ""),
  productName: String(review.productName || ""),
  user: String(review.user || ""),
  userName: String(review.userName || ""),
  userEmail: String(review.userEmail || ""),
  rating: Number(review.rating || 0),
  comment: String(review.comment || ""),
  status: String(review.status || "pending"),
  adminNote: String(review.adminNote || ""),
  approvedBy: review.approvedBy ? String(review.approvedBy) : null,
  approvedAt: review.approvedAt || null,
  rejectedAt: review.rejectedAt || null,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

async function recalculateProductStats(productId) {
  const objectId = new mongoose.Types.ObjectId(productId);
  const stats = await Review.aggregate([
    { $match: { product: objectId, status: "approved" } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats[0]?.averageRating || 0;
  const reviewCount = stats[0]?.reviewCount || 0;

  await Product.findByIdAndUpdate(productId, {
    rating: reviewCount ? Number(averageRating.toFixed(1)) : 0,
    reviews: reviewCount,
  });

  return {
    rating: reviewCount ? Number(averageRating.toFixed(1)) : 0,
    reviews: reviewCount,
  };
}

export async function getReviewSummary(productId) {
  await connectDB();
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: "approved" } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats[0]?.averageRating || 0;
  const reviewCount = stats[0]?.reviewCount || 0;

  return {
    averageRating: reviewCount ? Number(averageRating.toFixed(1)) : 0,
    reviewCount,
  };
}

export async function listPublishedReviewsByProductId(productId) {
  await connectDB();
  const reviews = await Review.find({
    product: productId,
    status: "approved",
  })
    .sort({ approvedAt: -1, createdAt: -1 })
    .lean();

  return reviews.map(normalizeReview);
}

export async function listPendingReviews() {
  await connectDB();
  const reviews = await Review.find({ status: "pending" })
    .sort({ createdAt: -1 })
    .lean();

  return reviews.map(normalizeReview);
}

export async function listAllReviews() {
  await connectDB();
  const reviews = await Review.find({})
    .sort({ createdAt: -1 })
    .lean();

  return reviews.map(normalizeReview);
}

export async function listReviewsByUser(userId) {
  await connectDB();
  const reviews = await Review.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  return reviews.map(normalizeReview);
}

export async function createReview({
  productId,
  userId,
  userName,
  userEmail,
  rating,
  comment,
}) {
  await connectDB();

  const product = await Product.findById(productId).lean();
  if (!product) {
    throw new Error("Product not found");
  }

  const existingReview = await Review.findOne({
    product: productId,
    user: userId,
  }).lean();

  if (existingReview) {
    throw new Error("You already submitted a review for this product");
  }

  const review = await Review.create({
    product: productId,
    productSlug: product.slug,
    productName: product.name,
    user: userId,
    userName,
    userEmail,
    rating,
    comment,
    status: "pending",
  });

  return normalizeReview(review.toObject());
}

export async function approveReview(reviewId, adminUserId) {
  await connectDB();
  const review = await Review.findByIdAndUpdate(
    reviewId,
    {
      $set: {
        status: "approved",
        approvedBy: adminUserId,
        approvedAt: new Date(),
        rejectedAt: null,
      },
    },
    { new: true },
  );

  if (!review) return null;

  await recalculateProductStats(review.product);
  return normalizeReview(review.toObject());
}

export async function rejectReview(reviewId, adminUserId) {
  await connectDB();
  const review = await Review.findByIdAndUpdate(
    reviewId,
    {
      $set: {
        status: "rejected",
        approvedBy: adminUserId,
        approvedAt: null,
        rejectedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!review) return null;

  await recalculateProductStats(review.product);
  return normalizeReview(review.toObject());
}

export async function updateReview(reviewId, userId, changes = {}, isAdmin = false) {
  await connectDB();
  const existing = await Review.findById(reviewId);

  if (!existing) return null;
  if (!isAdmin && String(existing.user) !== String(userId)) {
    throw new Error("Forbidden");
  }

  const nextRating = Number(changes.rating);
  const nextComment = String(changes.comment || "").trim();

  if (!Number.isFinite(nextRating) || nextRating < 1 || nextRating > 5) {
    throw new Error("Please choose a rating between 1 and 5.");
  }

  if (nextComment.length < 10) {
    throw new Error("Please write at least 10 characters.");
  }

  const wasApproved = existing.status === "approved";

  existing.rating = nextRating;
  existing.comment = nextComment;
  existing.status = "pending";
  existing.approvedBy = null;
  existing.approvedAt = null;
  existing.rejectedAt = null;

  await existing.save();

  if (wasApproved) {
    await recalculateProductStats(existing.product);
  }

  return normalizeReview(existing.toObject());
}

export async function adminUpdateReview(reviewId, changes = {}) {
  await connectDB();
  const review = await Review.findById(reviewId);

  if (!review) return null;

  const nextRating = Number(changes.rating);
  const nextComment = String(changes.comment || "").trim();

  if (!Number.isFinite(nextRating) || nextRating < 1 || nextRating > 5) {
    throw new Error("Please choose a rating between 1 and 5.");
  }

  if (nextComment.length < 10) {
    throw new Error("Please write at least 10 characters.");
  }

  const wasApproved = review.status === "approved";

  review.rating = nextRating;
  review.comment = nextComment;

  await review.save();

  if (wasApproved) {
    await recalculateProductStats(review.product);
  }

  return normalizeReview(review.toObject());
}

export async function deleteReview(reviewId, userId, isAdmin = false) {
  await connectDB();
  const review = await Review.findById(reviewId);
  if (!review) return null;

  if (!isAdmin && String(review.user) !== String(userId)) {
    throw new Error("Forbidden");
  }

  const wasApproved = review.status === "approved";
  await Review.findByIdAndDelete(reviewId);

  if (wasApproved) {
    await recalculateProductStats(review.product);
  }

  return normalizeReview(review.toObject());
}
