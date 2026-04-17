import mongoose from "mongoose";

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

const OrderItemSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    shortDescription: { type: String, default: "", trim: true },
    badge: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, default: "", trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
    },
    items: {
      type: [OrderItemSchema],
      default: [],
    },
    totals: {
      subtotal: { type: Number, required: true, min: 0 },
      shipping: { type: Number, required: true, min: 0 },
      tax: { type: Number, required: true, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    delivery: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "invoice", "mobile", "stripe", "paypal"],
      default: "card",
    },
    paymentProvider: {
      type: String,
      enum: ["stripe", "paypal", "manual"],
      default: "manual",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "authorized", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentReference: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "cancelled"],
      default: "pending",
      index: true,
    },
    statusHistory: {
      type: [
        {
          status: {
            type: String,
            enum: ["pending", "processing", "shipped", "cancelled"],
            required: true,
          },
          note: { type: String, default: "", trim: true },
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

OrderSchema.pre("save", function coerceLegacyDelivered() {
  if (this.status === "delivered") {
    this.status = "shipped";
  }
  if (Array.isArray(this.statusHistory)) {
    this.statusHistory.forEach((entry) => {
      if (entry && entry.status === "delivered") {
        entry.status = "shipped";
      }
    });
  }
});

export default mongoose.model("Order", OrderSchema);
