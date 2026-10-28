import React from "react";
import { Menu, UploadCloud, Play, RotateCcw, Undo2, FileSpreadsheet } from "lucide-react";

export function Header({
  metadata,
  onOpenMobile,
  onOpenUpload,
  onLoadDemo,
  onUndo,
  onReset,
  isLoading,
}) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E7EAF2] px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {metadata ? (
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hidden sm:block">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-slate-900 truncate max-w-xs sm:max-w-md">
                  {metadata.name}
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {metadata.total_rows.toLocaleString()} rows × {metadata.total_columns} cols
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Size: {metadata.memory_usage_formatted} • Missing: {metadata.missing_cells_percentage}% • Dups: {metadata.duplicate_rows_count}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-600">
              No dataset active
            </span>
            <span className="text-xs text-slate-400">
              — Upload or load demo to begin analysis
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {metadata && (
          <>
            <button
              onClick={onUndo}
              disabled={isLoading}
              title="Undo last cleaning operation"
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-200 transition text-xs font-medium hidden sm:flex items-center gap-1.5"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
            <button
              onClick={onReset}
              disabled={isLoading}
              title="Reset dataset to original uploaded version"
              className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition text-xs font-medium hidden sm:flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </>
        )}

        <button
          onClick={onLoadDemo}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5 fill-slate-700" />
          <span className="hidden sm:inline">Try</span> Demo Data
        </button>

        <button
          onClick={onOpenUpload}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 rounded-xl transition flex items-center gap-1.5"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload CSV</span>
        </button>
      </div>
    </header>
  );
}
