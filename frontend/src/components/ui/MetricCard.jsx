import React from "react";

export function MetricCard({ title, value, subtitle, icon: Icon, badge, color = "primary", onClick }) {
  const colorMap = {
    primary: "bg-indigo-50 text-indigo-600 border-indigo-100",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    error: "bg-rose-50 text-rose-600 border-rose-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    violet: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div
      onClick={onClick}
      className={`card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2] flex flex-col justify-between ${
        onClick ? "cursor-pointer hover:border-indigo-300" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${colorMap[color] || colorMap.primary}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {value !== undefined && value !== null ? value : "—"}
        </span>
        {badge && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 font-normal leading-relaxed truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}

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
