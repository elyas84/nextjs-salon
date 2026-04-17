import ToastProvider from "@/components/ToastProvider";
import CartProvider from "@/components/store/cart-provider";
import RootChrome from "@/components/layout/RootChrome";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "FixPro | Auto Care & Service",
    template: "%s | FixPro",
  },
  description:
    "High-performance auto care, diagnostics, maintenance, and precision services — engineered for drivers who demand more.",
  authors: [{ name: "FixPro" }],
  creator: "FixPro",
  openGraph: {
    title: "FixPro | Auto Care & Service",
    description:
      "Book services, explore performance parts, and learn about our precision-first approach to auto care.",
    type: "website",
    locale: "en_US",
    siteName: "FixPro",
  },
  twitter: {
    card: "summary_large_image",
    title: "FixPro | Auto Care & Service",
    description:
      "Precision-engineered services and performance parts.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="bg-zinc-950 text-zinc-50 antialiased">
        <CartProvider>
          <RootChrome>{children}</RootChrome>
          <ToastProvider />
        </CartProvider>
      </body>
    </html>
  );
}
