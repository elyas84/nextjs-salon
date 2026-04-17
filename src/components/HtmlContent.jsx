"use client";

export default function HtmlContent({ html, className = "" }) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}