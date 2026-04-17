import mongoose from "mongoose";

/** Statuses that reserve a workshop slot (one bay per date + time). */
export const SLOT_BLOCKING_STATUSES = ["pending", "confirmed", "waitlisted"];

export function statusBlocksSlot(status) {
  return SLOT_BLOCKING_STATUSES.includes(String(status || "").trim().toLowerCase());
}

/**
 * Count bookings that already hold this slot (optionally excluding one document by _id).
 * @param {import("mongoose").Model} BookingModel
 */
export async function countBlockingBookingsAtSlot(
  BookingModel,
  { preferredDate, preferredTime, excludeId },
) {
  const date = String(preferredDate || "").trim();
  const time = String(preferredTime || "").trim();
  const q = {
    preferredDate: date,
    preferredTime: time,
    status: { $in: SLOT_BLOCKING_STATUSES },
  };
  if (excludeId) {
    const id = String(excludeId).trim();
    if (mongoose.Types.ObjectId.isValid(id)) {
      q._id = { $ne: new mongoose.Types.ObjectId(id) };
    }
  }
  return BookingModel.countDocuments(q);
}

export const SLOT_TAKEN_MESSAGE =
  "This date and time are already booked. Please choose another slot.";

export function isMongoDuplicateKeyError(err) {
  return err && (err.code === 11000 || err.code === 11001);
}
