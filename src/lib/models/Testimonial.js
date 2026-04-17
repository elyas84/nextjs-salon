import mongoose from "mongoose";

const TestimonialSchema = new mongoose.Schema(
  {
    quote: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    label: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

TestimonialSchema.index({ order: 1, createdAt: 1 });

export default mongoose.models.Testimonial ||
  mongoose.model("Testimonial", TestimonialSchema);
