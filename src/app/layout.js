import ToastProvider from "@/components/ToastProvider";
import CartProvider from "@/components/store/cart-provider";
import RootChrome from "@/components/layout/RootChrome";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "Studio Salon | Hair & Beauty",
    template: "%s | Studio Salon",
  },
  description:
    "Book appointments, shop curated care products, and visit a calm studio for cuts, color, and treatments.",
  authors: [{ name: "Studio Salon" }],
  creator: "Studio Salon",
  openGraph: {
    title: "Studio Salon | Hair & Beauty",
    description:
      "Book appointments, browse retail, and learn about our approach to hair and beauty.",
    type: "website",
    locale: "en_US",
    siteName: "Studio Salon",
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio Salon | Hair & Beauty",
    description:
      "Hair, beauty, and curated retail in a calm studio setting.",
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
