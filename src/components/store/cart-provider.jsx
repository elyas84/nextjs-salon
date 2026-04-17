"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  CART_STORAGE_KEY,
  calculateCartTotals,
  normalizeCartItem,
  safeParse,
} from "@/lib/store/cart";

const CartContext = createContext(null);

function readInitialCart() {
  if (typeof window === "undefined") return [];

  const stored = window.localStorage.getItem(CART_STORAGE_KEY);
  const parsed = safeParse(stored, []);

  return Array.isArray(parsed) ? parsed.map(normalizeCartItem) : [];
}

export default function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrate = () => {
      setItems(readInitialCart());
      setHydrated(true);
    };

    if (typeof queueMicrotask === "function") {
      queueMicrotask(hydrate);
      return;
    }

    const timeoutId = window.setTimeout(hydrate, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo(() => {
    const clampQuantityForItem = (item, nextQty) => {
      const desired = Math.max(0, Number(nextQty || 0));
      const max = Number(item?.stockCount);
      if (!Number.isFinite(max) || max <= 0) return desired;
      return Math.min(desired, max);
    };

    const addItem = (product, quantity = 1) => {
      setItems((current) => {
        const normalized = normalizeCartItem({
          ...product,
          quantity,
        });
        const existing = current.find((item) => item.slug === normalized.slug);

        if (!existing) {
          return [
            ...current,
            {
              ...normalized,
              quantity: clampQuantityForItem(normalized, normalized.quantity),
            },
          ];
        }

        return current.map((item) =>
          item.slug === normalized.slug
            ? {
                ...item,
                name: normalized.name,
                category: normalized.category,
                price: normalized.price,
                compareAtPrice: normalized.compareAtPrice,
                shortDescription: normalized.shortDescription,
                badge: normalized.badge,
                accent: normalized.accent,
                image: normalized.image || item.image,
                stockCount: normalized.stockCount ?? item.stockCount,
                quantity: clampQuantityForItem(
                  { ...item, stockCount: normalized.stockCount ?? item.stockCount },
                  item.quantity + quantity,
                ),
              }
            : item,
        );
      });
    };

    const updateQuantity = (slug, quantity) => {
      setItems((current) =>
        current
          .map((item) =>
            item.slug === slug
              ? { ...item, quantity: clampQuantityForItem(item, quantity) }
              : item,
          )
          .filter((item) => item.quantity > 0),
      );
    };

    const removeItem = (slug) => {
      setItems((current) => current.filter((item) => item.slug !== slug));
    };

    const clearCart = () => {
      setItems([]);
    };

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totals = calculateCartTotals(items, "standard");

    return {
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      itemCount,
      totals,
      hydrated,
    };
  }, [hydrated, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
