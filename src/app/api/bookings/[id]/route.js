import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import {
  countBlockingBookingsAtSlot,
  isMongoDuplicateKeyError,
  SLOT_TAKEN_MESSAGE,
  statusBlocksSlot,
} from "@/lib/booking-slot-availability";
import { isAllowedBookingDate, isValidSlotForDate } from "@/lib/booking-slots";
import {
  scheduleBookingConfirmedEmails,
  sendBookingCancelledEmail,
  sendBookingCompletedEmail,
  sendBookingDeletedEmail,
  sendBookingUpdatedEmail,
} from "@/lib/booking-confirmation-email";
import { connectDB } from "@/lib/db";
import Booking from "@/lib/models/Booking";
import { normalizeBookingReference } from "@/lib/booking-reference";

export const dynamic = "force-dynamic";

const STATUS_ENUM = ["pending", "confirmed", "waitlisted", "completed", "cancelled"];

const CUSTOMER_BOOKING_NOTIFY_KEYS = [
  "fullName",
  "email",
  "phone",
  "registrationNumber",
  "serviceType",
  "preferredDate",
  "preferredTime",
  "notes",
  "status",
];

function bookingFieldEqual(a, b) {
  return String(a ?? "").trim() === String(b ?? "").trim();
}

export async function GET(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const booking = await Booking.findById(id).lean();
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json(
      { booking: { ...booking, _id: String(booking._id) } },
      { status: 200 },
    );
  } catch (err) {
    console.error("Get booking error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const existing = await Booking.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const wasConfirmed =
      String(existing.status || "").toLowerCase() === "confirmed";

    const patch = {};

    if (typeof body.fullName !== "undefined")
      patch.fullName = String(body.fullName || "").trim();
    if (typeof body.email !== "undefined")
      patch.email = String(body.email || "").trim().toLowerCase();
    if (typeof body.phone !== "undefined") patch.phone = String(body.phone || "").trim();
    if (typeof body.registrationNumber !== "undefined")
      patch.registrationNumber = normalizeBookingReference(
        body.registrationNumber,
      );
    if (typeof body.serviceType !== "undefined")
      patch.serviceType = String(body.serviceType || "").trim();
    if (typeof body.preferredDate !== "undefined")
      patch.preferredDate = String(body.preferredDate || "").trim();
    if (typeof body.preferredTime !== "undefined")
      patch.preferredTime = String(body.preferredTime || "").trim();
    if (typeof body.notes !== "undefined") patch.notes = String(body.notes || "").trim();
    if (typeof body.adminNotes !== "undefined")
      patch.adminNotes = String(body.adminNotes || "").trim();
    if (typeof body.status !== "undefined") {
      const s = String(body.status || "").trim().toLowerCase();
      if (!STATUS_ENUM.includes(s)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      patch.status = s;
    }

    const merged = { ...existing, ...patch };
    if (merged.preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(merged.preferredDate)) {
      return NextResponse.json(
        { error: "preferredDate must be yyyy-mm-dd" },
        { status: 400 },
      );
    }
    const dateTouched = typeof body.preferredDate !== "undefined";
    if (
      dateTouched &&
      merged.preferredDate &&
      !isAllowedBookingDate(merged.preferredDate)
    ) {
      return NextResponse.json(
        {
          error:
            "Date must be today or later on an open day (not Sunday).",
        },
        { status: 400 },
      );
    }
    if (
      merged.preferredTime &&
      !isValidSlotForDate(merged.preferredDate, merged.preferredTime)
    ) {
      return NextResponse.json(
        { error: "Invalid time for the selected day (check opening hours)." },
        { status: 400 },
      );
    }

    if (patch.fullName !== undefined && !patch.fullName) {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    }
    if (patch.email !== undefined && !patch.email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    if (patch.registrationNumber !== undefined && !patch.registrationNumber) {
      return NextResponse.json(
        { error: "registrationNumber is required" },
        { status: 400 },
      );
    }
    if (patch.serviceType !== undefined && !patch.serviceType) {
      return NextResponse.json({ error: "serviceType is required" }, { status: 400 });
    }

    if (
      statusBlocksSlot(merged.status) &&
      merged.preferredDate &&
      merged.preferredTime
    ) {
      const taken = await countBlockingBookingsAtSlot(Booking, {
        preferredDate: merged.preferredDate,
        preferredTime: merged.preferredTime,
        excludeId: id,
      });
      if (taken > 0) {
        return NextResponse.json({ error: SLOT_TAKEN_MESSAGE }, { status: 409 });
      }
    }

    let booking;
    try {
      booking = await Booking.findByIdAndUpdate(id, patch, {
        new: true,
        runValidators: true,
      }).lean();
    } catch (err) {
      if (isMongoDuplicateKeyError(err)) {
        return NextResponse.json({ error: SLOT_TAKEN_MESSAGE }, { status: 409 });
      }
      throw err;
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const normalized = { ...booking, _id: String(booking._id) };
    const prevStatus = String(existing.status || "").toLowerCase();
    const newStatus = String(booking.status || "").toLowerCase();

    const becameConfirmed =
      newStatus === "confirmed" && !wasConfirmed;
    if (becameConfirmed) {
      scheduleBookingConfirmedEmails(normalized);
    }

    const becameCompleted =
      newStatus === "completed" && prevStatus !== "completed";
    const becameCancelled =
      newStatus === "cancelled" && prevStatus !== "cancelled";

    if (becameCompleted) {
      void sendBookingCompletedEmail(normalized).catch((err) =>
        console.error("Booking completed email failed:", err),
      );
    }
    if (becameCancelled) {
      void sendBookingCancelledEmail(normalized).catch((err) =>
        console.error("Booking cancelled email failed:", err),
      );
    }

    const changedCustomerKeys = CUSTOMER_BOOKING_NOTIFY_KEYS.filter(
      (key) => !bookingFieldEqual(existing[key], booking[key]),
    );
    const shouldSendGenericUpdate =
      changedCustomerKeys.length > 0 &&
      !becameConfirmed &&
      !becameCompleted &&
      !becameCancelled;

    if (shouldSendGenericUpdate) {
      void sendBookingUpdatedEmail({
        previous: existing,
        booking: normalized,
        changedKeys: changedCustomerKeys,
      }).catch((err) =>
        console.error("Booking update notification email failed:", err),
      );
    }

    return NextResponse.json(
      { message: "Booking updated", booking: normalized },
      { status: 200 },
    );
  } catch (err) {
    console.error("Update booking error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Booking.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    const deletedNorm = { ...deleted, _id: String(deleted._id) };
    void sendBookingDeletedEmail(deletedNorm).catch((err) =>
      console.error("Booking deleted email failed:", err),
    );
    return NextResponse.json({ message: "Booking deleted" }, { status: 200 });
  } catch (err) {
    console.error("Delete booking error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
