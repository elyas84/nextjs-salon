import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import Review from "@/lib/models/Review";
import User from "@/lib/models/User";

const normalizeUser = (user, stats = {}) => ({
  _id: String(user._id),
  name: String(user.name || ""),
  email: String(user.email || ""),
  role: String(user.role || "client"),
  isActive: Boolean(user.isActive),
  lastLogin: user.lastLogin || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  orderCount: Number(stats.orderCount || 0),
  reviewCount: Number(stats.reviewCount || 0),
  pendingReviews: Number(stats.pendingReviews || 0),
  approvedReviews: Number(stats.approvedReviews || 0),
  rejectedReviews: Number(stats.rejectedReviews || 0),
  latestOrderStatus: String(stats.latestOrderStatus || ""),
  latestOrderAt: stats.latestOrderAt || null,
});

export async function listUsersWithStats() {
  await connectDB();

  const users = await User.find({})
    .sort({ createdAt: -1 })
    .lean();

  const userIds = users.map((user) => user._id);

  const [orderStats, reviewStats] = await Promise.all([
    Order.aggregate([
      { $match: { user: { $in: userIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          latestOrderStatus: { $first: "$status" },
          latestOrderAt: { $first: "$createdAt" },
        },
      },
    ]),
    Review.aggregate([
      { $match: { user: { $in: userIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$user",
          reviewCount: { $sum: 1 },
          pendingReviews: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
          approvedReviews: {
            $sum: {
              $cond: [{ $eq: ["$status", "approved"] }, 1, 0],
            },
          },
          rejectedReviews: {
            $sum: {
              $cond: [{ $eq: ["$status", "rejected"] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const orderMap = orderStats.reduce((acc, item) => {
    acc[String(item._id)] = item;
    return acc;
  }, {});

  const reviewMap = reviewStats.reduce((acc, item) => {
    acc[String(item._id)] = item;
    return acc;
  }, {});

  return users.map((user) =>
    normalizeUser(user, {
      ...(orderMap[String(user._id)] || {}),
      ...(reviewMap[String(user._id)] || {}),
    }),
  );
}
