import React from "react";

export function Badge({ type, children, size = "md" }) {
  const typeStyles = {
    numeric: "bg-blue-50 text-blue-700 border-blue-200",
    categorical: "bg-purple-50 text-purple-700 border-purple-200",
    datetime: "bg-amber-50 text-amber-700 border-amber-200",
    boolean: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "bg-slate-100 text-slate-700 border-slate-200",
    critical: "bg-rose-50 text-rose-700 border-rose-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${
        typeStyles[type] || "bg-slate-100 text-slate-700 border-slate-200"
      } ${sizeStyles[size] || sizeStyles.md}`}
    >
      {children || type}
    </span>
  );
}

export default Badge;
