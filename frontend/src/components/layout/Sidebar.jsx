import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  TableProperties,
  ShieldCheck,
  Sparkles,
  BarChart3,
  LineChart,
  GitCompare,
  Lightbulb,
  FileDown,
  GraduationCap,
  Activity,
  HeartPulse,
} from "lucide-react";

export function Sidebar({ isMobileOpen, closeMobile }) {
  const navItems = [
    { name: "Overview", path: "/", icon: LayoutDashboard },
    { name: "Dataset Explorer", path: "/explorer", icon: TableProperties },
    { name: "Data Quality", path: "/quality", icon: ShieldCheck },
    { name: "Cleaning Studio", path: "/cleaning", icon: Sparkles },
    { name: "Analytics & Stats", path: "/analytics", icon: BarChart3 },
    { name: "Visualization Lab", path: "/visualizations", icon: LineChart },
    { name: "Dataset Comparison", path: "/comparison", icon: GitCompare },
    { name: "Insights & Anomalies", path: "/insights", icon: Lightbulb },
    { name: "Reports & Exports", path: "/reports", icon: FileDown },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-[#E7EAF2] flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E7EAF2] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <HeartPulse className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Data<span className="text-indigo-600">Doctor</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Diagnose & fix datasets
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#E7EAF2] bg-[#F7F8FC]/60">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Diagnostic Engine Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
            Offline Dataset Health & Analytics
          </p>
        </div>
      </aside>
    </>
  );
}
