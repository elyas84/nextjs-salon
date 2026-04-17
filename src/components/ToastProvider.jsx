"use client";

import { Toaster } from "react-hot-toast";

/** Matches public/store stone + amber surfaces (#0a0908 / #0c0b09) */
const surface = "rgba(12, 11, 9, 0.97)";
const border = "rgba(120, 113, 108, 0.35)";
const text = "#e7e5e4";
const iconBg = "#0c0b09";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      gutter={10}
      containerStyle={{ zIndex: 99999 }}
      toastOptions={{
        duration: 3400,
        className: "font-sans",
        style: {
          background: surface,
          color: text,
          border: `1px solid ${border}`,
          borderRadius: "12px",
          fontSize: "13px",
          fontWeight: "500",
          lineHeight: 1.45,
          padding: "11px 14px",
          maxWidth: "min(100vw - 2rem, 22rem)",
          boxShadow:
            "0 24px 64px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.04)",
          backdropFilter: "saturate(150%) blur(12px)",
          fontFamily: "var(--font-body), system-ui, sans-serif",
        },
        success: {
          style: {
            borderLeft: "3px solid rgba(245, 158, 11, 0.9)",
          },
          iconTheme: {
            primary: "#f59e0b",
            secondary: iconBg,
          },
        },
        error: {
          style: {
            borderLeft: "3px solid rgba(248, 113, 113, 0.95)",
          },
          iconTheme: {
            primary: "#f87171",
            secondary: iconBg,
          },
        },
        loading: {
          iconTheme: {
            primary: "#d6d3d1",
            secondary: iconBg,
          },
        },
      }}
    />
  );
}
