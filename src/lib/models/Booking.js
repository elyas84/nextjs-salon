import mongoose from "mongoose";

if (mongoose.models.Booking) {
  delete mongoose.models.Booking;
}

const BookingSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: "", trim: true },
    registrationNumber: { type: String, required: true, trim: true, index: true },
    serviceType: { type: String, required: true, trim: true },
    preferredDate: { type: String, required: true, trim: true }, // yyyy-mm-dd
    preferredTime: { type: String, default: "", trim: true }, // HH:mm
    userId: { type: String, default: "", trim: true, index: true },
    notes: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "waitlisted", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    adminNotes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

BookingSchema.index(
  { preferredDate: 1, preferredTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed", "waitlisted"] },
    },
  },
);

export default mongoose.model("Booking", BookingSchema);

