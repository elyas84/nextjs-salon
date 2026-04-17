"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      gutter={12}
      toastOptions={{
        duration: 3200,
        style: {
          background: "rgba(24, 24, 27, 0.96)",
          color: "#fafafa",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "14px",
          fontSize: "13px",
          fontWeight: "500",
          padding: "12px 16px",
          boxShadow:
            "0 20px 50px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.3)",
          backdropFilter: "saturate(140%) blur(10px)",
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "#18181b",
          },
        },
        error: {
          iconTheme: {
            primary: "#fb7185",
            secondary: "#18181b",
          },
        },
      }}
    />
  );
}
