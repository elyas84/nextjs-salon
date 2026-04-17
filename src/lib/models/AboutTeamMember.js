import mongoose from "mongoose";

/** One row per person on the About page “Engineers” grid (separate from embedded legacy `SiteSettings.teamMembers`). */
const AboutTeamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "", trim: true },
    imageAlt: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

AboutTeamMemberSchema.index({ order: 1, createdAt: 1 });

export default mongoose.models.AboutTeamMember ||
  mongoose.model("AboutTeamMember", AboutTeamMemberSchema);
