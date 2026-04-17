"use client";

import { ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "@/components/store/cart-provider";

export default function AddToCartButton({
  product,
  children = "Add to cart",
  className = "",
  iconClassName = "size-4",
  quantity = 1,
}) {
  const { addItem } = useCart();

  const handleAdd = () => {
    const stock = Number(product?.stockCount);
    if (Number.isFinite(stock) && stock <= 0) {
      toast.error("This item is out of stock.");
      return;
    }
    addItem(product, quantity);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 ${className}`}
    >
      <ShoppingCart className={iconClassName} aria-hidden />
      {children}
    </button>
  );
}
