import Link from "next/link";

export default function HeroCtaLink({ href, className, children }) {
  const h = String(href || "").trim() || "/";
  if (h.startsWith("http://") || h.startsWith("https://")) {
    return (
      <a
        href={h}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={h} className={className}>
      {children}
    </Link>
  );
}
