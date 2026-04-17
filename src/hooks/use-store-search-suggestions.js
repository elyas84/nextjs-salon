"use client";

import { useEffect, useMemo, useState } from "react";
import { computeProductSearchSuggestions } from "@/lib/store/product-search";

/**
 * @param {string} query
 * @param {{ products?: Array<object>, limit?: number, debounceMs?: number }} options
 * Pass `products` for client-side matching; omit for debounced `/api/store/search` requests.
 */
export function useStoreSearchSuggestions(query, options = {}) {
  const { products, limit = 8, debounceMs = 200 } = options;
  const [remote, setRemote] = useState([]);
  const [loading, setLoading] = useState(false);
  const trimmed = String(query || "").trim();

  const local = useMemo(() => {
    if (products === undefined) return [];
    return computeProductSearchSuggestions(products, query, limit);
  }, [products, query, limit]);

  useEffect(() => {
    if (products !== undefined) return undefined;

    if (trimmed.length < 1) {
      setRemote([]);
      setLoading(false);
      return undefined;
    }

    const id = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: trimmed,
          limit: String(limit),
        });
        const res = await fetch(`/api/store/search?${params.toString()}`);
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setRemote(Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch {
        setRemote([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => window.clearTimeout(id);
  }, [trimmed, products, limit, debounceMs]);

  if (products !== undefined) {
    return { suggestions: local, loading: false };
  }

  return { suggestions: remote, loading };
}
