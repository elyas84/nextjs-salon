// components/Spinner.jsx
export default function Spinner({ size = "sm", className = "" }) {
  const sizes = {
    xs: "h-10 w-10 border",
    sm: "h-10 w-10 border-2",
    md: "h-10 w-10 border-2",
  };

  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-slate-200 border-t-slate-700 ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
