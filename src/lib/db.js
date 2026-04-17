import mongoose from "mongoose";
import { requiredEnv } from "@/lib/env";

const MONGO_URI = requiredEnv("MONGO_DB_URI");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, {
        bufferCommands: false,
      })
      .then((mongoose) => {
        console.log("MongoDB connected.");
        return mongoose;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};
