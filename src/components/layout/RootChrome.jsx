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
      <main className="min-h-[calc(100vh-160px)] bg-zinc-950 pt-20">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

