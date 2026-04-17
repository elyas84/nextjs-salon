import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGO_URI = process.env.MONGO_DB_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_DB_URI is not defined in .env.local");
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["superadmin"], default: "superadmin" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Change these values to your own
    const adminData = {
      name: "Elyas",
      email: "elyasarkint@gmail.com",
      password: "123456A", // change before running
      role: "superadmin",
    };

    const existing = await User.findOne({ email: adminData.email });
    if (existing) {
      console.log("⚠️  Superadmin already exists, skipping.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    await User.create({ ...adminData, password: hashedPassword });

    console.log("✅ Superadmin created successfully");
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Role:  ${adminData.role}`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
