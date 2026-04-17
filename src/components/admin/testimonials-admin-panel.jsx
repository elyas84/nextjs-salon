"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, PencilLine, Plus, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  initialsFromName,
  orderToStarLevel,
} from "@/lib/testimonial-initials";

function OrderStarsPicker({ value, onChange, disabled }) {
  const v = Math.min(5, Math.max(1, Number(value) || 3));
  return (
    <div
      className="inline-flex gap-0.5 rounded-xl border border-white/10 bg-zinc-950/80 p-1.5"
      role="group"
      aria-label="Display order, 1 to 5 stars"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= v;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className="rounded-lg p-1 transition hover:bg-white/10 disabled:opacity-50"
            aria-label={`Order ${n} of 5`}
            aria-pressed={active}
          >
            <Star
              className={`size-6 sm:size-7 ${
                active
                  ? "fill-orange-400 text-orange-400"
                  : "text-zinc-600"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function OrderStarsRead({ order }) {
  const v = orderToStarLevel(order);
  return (
    <div className="flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-3.5 shrink-0 ${
            n <= v ? "fill-orange-400 text-orange-400" : "text-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}

export default function TestimonialsAdminPanel() {
  const [loading, setLoading] = useState(true);
  const [sectionHeadline, setSectionHeadline] = useState("CLIENT VOICES");
  const [testimonials, setTestimonials] = useState([]);
  const [savingHeadline, setSavingHeadline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const formRef = useRef(null);

  const [editingId, setEditingId] = useState(null);
  const [formQuote, setFormQuote] = useState("");
  const [formName, setFormName] = useState("");
  const [formStarOrder, setFormStarOrder] = useState(3);

  const applyPayload = useCallback((payload) => {
    if (!payload || typeof payload !== "object") return;
    if (typeof payload.sectionHeadline === "string") {
      setSectionHeadline(payload.sectionHeadline);
    }
    if (Array.isArray(payload.testimonials)) {
      setTestimonials(payload.testimonials);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/testimonials", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to load testimonials.");
        return;
      }
      applyPayload(data);
    } finally {
      setLoading(false);
    }
  }, [applyPayload]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setFormQuote("");
    setFormName("");
    setFormStarOrder(3);
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setFormQuote(t.quote || "");
    setFormName(t.name || "");
    setFormStarOrder(orderToStarLevel(t.order));
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  const saveHeadline = async () => {
    setSavingHeadline(true);
    try {
      const res = await fetch("/api/testimonials/section", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline: sectionHeadline }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403) {
          toast.error("You don’t have permission to save.");
        } else {
          toast.error(data.error || "Save failed.");
        }
        return;
      }
      applyPayload(data);
      toast.success("Section headline saved.");
    } finally {
      setSavingHeadline(false);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    const quote = formQuote.trim();
    const name = formName.trim();
    if (!quote || !name) {
      toast.error("Quote and name are required.");
      return;
    }

    const order = Math.min(5, Math.max(1, Number(formStarOrder) || 3));

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/testimonials/${editingId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quote,
            name,
            label: "",
            order,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data.error || "Update failed.");
          return;
        }
        applyPayload(data);
        resetForm();
        toast.success("Testimonial updated.");
        return;
      }

      const res = await fetch("/api/testimonials", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote,
          name,
          label: "",
          order,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Could not add testimonial.");
        return;
      }
      applyPayload(data);
      resetForm();
      toast.success("Testimonial added.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/testimonials/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Delete failed.");
        return;
      }
      applyPayload(data);
      if (editingId === id) resetForm();
      setDeleteConfirm((c) => (c?.id === id ? null : c));
      toast.success("Testimonial removed.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 className="size-5 animate-spin" />
        Loading testimonials…
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500/30";
  const labelClass =
    "mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-zinc-500";

  const sorted = [...testimonials].sort(
    (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0),
  );

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          About page · Testimonials block
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          Shown on <span className="text-zinc-200">/about</span> between the team
          grid and the bottom CTA. More stars = higher priority in the list sort.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className={labelClass}>Section headline</span>
            <input
              value={sectionHeadline}
              onChange={(e) => setSectionHeadline(e.target.value)}
              className={inputClass}
            />
          </label>
          <button
            type="button"
            onClick={saveHeadline}
            disabled={savingHeadline}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-orange-100 transition hover:bg-orange-500/25 disabled:opacity-50"
          >
            {savingHeadline ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Save headline
          </button>
        </div>
      </div>

      <form
        ref={formRef}
        onSubmit={submitForm}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {editingId ? "Edit testimonial" : "New testimonial"}
          </p>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={labelClass}>Quote</span>
            <textarea
              required
              rows={4}
              value={formQuote}
              onChange={(e) => setFormQuote(e.target.value)}
              className={`${inputClass} resize-y`}
              placeholder="Customer quote…"
            />
          </label>

          <div className="sm:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div
              className="flex size-16 shrink-0 items-center justify-center rounded-full border border-orange-500/35 bg-gradient-to-br from-orange-500/30 to-zinc-900 font-heading text-lg font-bold tracking-tight text-orange-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-white/10"
              aria-hidden
            >
              {initialsFromName(formName)}
            </div>
            <label className="min-w-0 flex-1">
              <span className={labelClass}>Name</span>
              <input
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className={inputClass}
                placeholder="Full name"
              />
            </label>
          </div>

          <div className="sm:col-span-2">
            <span className={labelClass}>Display order</span>
            <p className="mb-2 text-xs text-zinc-500">
              Tap a star (1 = first, 5 = highest priority). Same as sort order on
              the site.
            </p>
            <OrderStarsPicker
              value={formStarOrder}
              onChange={setFormStarOrder}
              disabled={saving}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/20 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-orange-100 transition hover:bg-orange-500/30 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : editingId ? (
              <PencilLine className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            {editingId ? "Save changes" : "Add testimonial"}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          All testimonials ({sorted.length})
        </p>
        {sorted.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No testimonials yet. Use the form above to add one.
          </p>
        ) : (
          <div className="mt-4 space-y-3 sm:hidden">
            {sorted.map((t) => {
              const preview =
                (t.quote || "").length > 220
                  ? `${(t.quote || "").slice(0, 220)}…`
                  : t.quote || "—";
              const isRowEditing = editingId === t.id;
              return (
                <div
                  key={t.id}
                  className={`rounded-2xl border p-4 ${
                    isRowEditing
                      ? "border-orange-500/30 bg-orange-500/10"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <OrderStarsRead order={t.order} />
                      <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                        {preview}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <div
                          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-orange-500/25 to-zinc-900 text-[11px] font-bold text-orange-200"
                          aria-hidden
                        >
                          {initialsFromName(t.name)}
                        </div>
                        <span className="truncate text-xs font-semibold text-zinc-200">
                          {t.name || "—"}
                        </span>
                      </div>
                    </div>
                    <div className="inline-flex shrink-0 flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(t)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-zinc-200 transition hover:bg-white/10"
                      >
                        <PencilLine className="size-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirm({
                            id: t.id,
                            name:
                              String(t.name || "").trim() ||
                              "this testimonial",
                          })
                        }
                        disabled={deletingId === t.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {deletingId === t.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 hidden overflow-x-auto rounded-xl border border-white/10 sm:block">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Order
                </th>
                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Quote
                </th>
                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Name
                </th>
                <th className="px-3 py-2.5 text-right text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-sm text-zinc-500"
                  >
                    No testimonials yet. Use the form above to add one.
                  </td>
                </tr>
              ) : (
                sorted.map((t) => {
                  const preview =
                    (t.quote || "").length > 120
                      ? `${(t.quote || "").slice(0, 120)}…`
                      : t.quote || "—";
                  const isRowEditing = editingId === t.id;
                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-white/5 last:border-0 ${
                        isRowEditing ? "bg-orange-500/10" : ""
                      }`}
                    >
                      <td className="px-3 py-3 align-middle">
                        <OrderStarsRead order={t.order} />
                      </td>
                      <td className="max-w-md px-3 py-3 align-top text-xs leading-relaxed text-zinc-300">
                        {preview}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-orange-500/25 to-zinc-900 text-[11px] font-bold text-orange-200"
                            aria-hidden
                          >
                            {initialsFromName(t.name)}
                          </div>
                          <span className="text-xs font-semibold text-zinc-200">
                            {t.name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-middle text-right">
                        <div className="inline-flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(t)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-zinc-200 transition hover:bg-white/10"
                          >
                            <PencilLine className="size-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirm({
                                id: t.id,
                                name: String(t.name || "").trim() || "this testimonial",
                              })
                            }
                            disabled={deletingId === t.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                          >
                            {deletingId === t.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteConfirm ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="testimonial-delete-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
            onClick={() => {
              if (!deletingId) setDeleteConfirm(null);
            }}
            aria-label="Dismiss"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl shadow-black/50">
            <h3
              id="testimonial-delete-title"
              className="font-heading text-lg font-bold text-zinc-50"
            >
              Delete testimonial?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              This will remove{" "}
              <span className="font-semibold text-zinc-200">
                “
                {deleteConfirm.name.length > 80
                  ? `${deleteConfirm.name.slice(0, 80)}…`
                  : deleteConfirm.name}
                ”
              </span>{" "}
              from the About page. This can’t be undone.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={Boolean(deletingId)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wide text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => remove(deleteConfirm.id)}
                disabled={deletingId === deleteConfirm.id}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-2 text-xs font-black uppercase tracking-wide text-red-100 transition hover:bg-red-500/30 disabled:opacity-50"
              >
                {deletingId === deleteConfirm.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
