"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "@/components/kinetic/SiteFooter";
import SiteHeader from "@/components/kinetic/SiteHeader";

function shouldHideMarketingChrome(pathname) {
  const p = String(pathname || "");
  return p === "/admin" || p.startsWith("/admin/") || p === "/dashboard" || p.startsWith("/dashboard/");
}

export default function RootChrome({ children }) {
  const pathname = usePathname();
  const hideChrome = shouldHideMarketingChrome(pathname);

  if (hideChrome) {
    return <main className="min-h-screen bg-zinc-950">{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <main className="public-page min-h-[calc(100vh-160px)] pb-3 pt-20">
        <div className="relative z-[1]">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

