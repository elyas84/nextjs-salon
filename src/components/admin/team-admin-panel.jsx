"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, PencilLine, Plus, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";

export default function TeamAdminPanel() {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const formRef = useRef(null);

  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImageAlt, setFormImageAlt] = useState("");
  const [uploading, setUploading] = useState(false);

  const applyPayload = useCallback((payload) => {
    if (!payload || typeof payload !== "object") return;
    if (Array.isArray(payload.team)) {
      setTeam(payload.team);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to load team.");
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
    setFormName("");
    setFormRole("");
    setFormImageUrl("");
    setFormImageAlt("");
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setFormName(m.name || "");
    setFormRole(m.role || "");
    setFormImageUrl(m.imageUrl || "");
    setFormImageAlt(m.imageAlt || "");
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      fd.append("uploadType", "gallery");
      const res = await fetch("/api/uploads", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Upload failed.");
        return;
      }
      const urls = Array.isArray(data.files)
        ? data.files.map((x) => x?.url).filter(Boolean)
        : [];
      if (urls[0]) {
        setFormImageUrl(urls[0]);
        toast.success("Photo uploaded.");
      }
    } finally {
      setUploading(false);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    const name = formName.trim();
    if (!name) {
      toast.error("Name is required.");
      return;
    }

    const body = {
      name,
      role: formRole.trim(),
      imageUrl: formImageUrl.trim(),
      imageAlt: formImageAlt.trim(),
      order: 0,
    };

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/team/${editingId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data.error || "Update failed.");
          return;
        }
        applyPayload(data);
        resetForm();
        toast.success("Team member updated.");
        return;
      }

      const res = await fetch("/api/team", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Could not add team member.");
        return;
      }
      applyPayload(data);
      resetForm();
      toast.success("Team member added.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/team/${id}`, {
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
      toast.success("Team member removed.");
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500/30";
  const labelClass =
    "mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-zinc-500";

  const sorted = [...team].sort(
    (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0),
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 className="size-5 animate-spin" />
        Loading team…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form
        ref={formRef}
        onSubmit={submitForm}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {editingId ? "Edit team member" : "New team member"}
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
            <span className={labelClass}>Name</span>
            <input
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className={inputClass}
              placeholder="Full name"
            />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Role</span>
            <input
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              className={inputClass}
              placeholder="Title or role"
            />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Photo URL</span>
            <input
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              className={inputClass}
              placeholder="https://…"
            />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Photo alt</span>
            <input
              value={formImageAlt}
              onChange={(e) => setFormImageAlt(e.target.value)}
              className={inputClass}
              placeholder="Short description for screen readers"
            />
          </label>
          <div className="sm:col-span-2">
            <input
              id="team-panel-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) uploadPhoto(f);
              }}
            />
            <label
              htmlFor="team-panel-upload"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-200 transition hover:bg-white/10"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Upload photo
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={
              saving || uploading || (!editingId && team.length >= 12)
            }
            className="inline-flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/20 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-orange-100 transition hover:bg-orange-500/30 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : editingId ? (
              <PencilLine className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            {editingId ? "Save member" : "Add team member"}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          All team members ({sorted.length})
        </p>
        {sorted.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No team members yet. Use the form above.
          </p>
        ) : (
          <div className="mt-4 space-y-3 sm:hidden">
            {sorted.map((m) => {
              const rolePreview =
                (m.role || "").length > 140
                  ? `${(m.role || "").slice(0, 140)}…`
                  : m.role || "—";
              const isRowEditing = editingId === m.id;
              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border p-4 ${
                    isRowEditing
                      ? "border-orange-500/30 bg-orange-500/10"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-200">
                        {m.name || "—"}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                        {rolePreview}
                      </p>
                    </div>
                    <div className="inline-flex shrink-0 flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(m)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-zinc-200 transition hover:bg-white/10"
                      >
                        <PencilLine className="size-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirm({
                            id: m.id,
                            name: String(m.name || "").trim() || "this person",
                          })
                        }
                        disabled={deletingId === m.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {deletingId === m.id ? (
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
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Role
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
                    colSpan={3}
                    className="px-3 py-8 text-center text-sm text-zinc-500"
                  >
                    No team members yet. Use the form above.
                  </td>
                </tr>
              ) : (
                sorted.map((m) => {
                  const rolePreview =
                    (m.role || "").length > 80
                      ? `${(m.role || "").slice(0, 80)}…`
                      : m.role || "—";
                  const isRowEditing = editingId === m.id;
                  return (
                    <tr
                      key={m.id}
                      className={`border-b border-white/5 last:border-0 ${
                        isRowEditing ? "bg-orange-500/10" : ""
                      }`}
                    >
                      <td className="max-w-xs px-3 py-3 align-top text-xs leading-relaxed text-zinc-300">
                        {rolePreview}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <span className="text-xs font-semibold text-zinc-200">
                          {m.name || "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-middle text-right">
                        <div className="inline-flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(m)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-zinc-200 transition hover:bg-white/10"
                          >
                            <PencilLine className="size-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirm({
                                id: m.id,
                                name:
                                  String(m.name || "").trim() || "this person",
                              })
                            }
                            disabled={deletingId === m.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                          >
                            {deletingId === m.id ? (
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
          aria-labelledby="team-delete-confirm-title"
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
              id="team-delete-confirm-title"
              className="font-heading text-lg font-bold text-zinc-50"
            >
              Remove team member?
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
