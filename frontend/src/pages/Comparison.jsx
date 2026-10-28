import React, { useState, useRef } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  GitCompare,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../components/ui/Toast";
import { api } from "../services/api";

export function Comparison() {
  const { datasetId, metadata } = useOutletContext();
  const { showToast } = useToast();

  const [compareId, setCompareId] = useState(null);
  const [compareName, setCompareName] = useState("");
  const [keyColumn, setKeyColumn] = useState("");
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUploadCompareFile = async (file) => {
    if (!file) return;
    setIsLoading(true);
    try {
      const newMeta = await api.uploadCsv(file);
      setCompareId(newMeta.dataset_id);
      setCompareName(newMeta.name);
      showToast(`Uploaded comparison dataset: ${newMeta.name}`, "success");
      
      // Auto run comparison
      const res = await api.compareDatasets(datasetId, newMeta.dataset_id, keyColumn || null);
      setComparisonResult(res);
    } catch (err) {
      showToast(err.message || "Failed to compare datasets", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRerunComparison = async () => {
    if (!datasetId || !compareId) return;
    setIsLoading(true);
    try {
      const res = await api.compareDatasets(datasetId, compareId, keyColumn || null);
      setComparisonResult(res);
      showToast("Updated comparison results!", "success");
    } catch (err) {
      showToast(err.message || "Comparison failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!datasetId || !metadata) {
    return (
      <div className="card-shine rounded-3xl p-8 bg-white border border-[#E7EAF2] text-center max-w-xl mx-auto my-12">
        <GitCompare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Dataset Active</h3>
        <p className="text-xs text-slate-500 mb-4">
          Please upload a base dataset first to enable dataset comparison.
        </p>
        <Link to="/" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
          Go to Overview
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <GitCompare className="w-6 h-6 text-indigo-600" />
          <span>Dataset Comparison Lab</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Perform schema diffing, statistical delta analysis, and key-based record modifications against a second CSV file.
        </p>
      </div>

      {/* Comparison Selector / Upload Box */}
      <div className="card-shine p-6 rounded-2xl bg-white border border-[#E7EAF2]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Base Dataset Info */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
              Base Dataset (Active)
            </span>
            <h4 className="font-bold text-base text-slate-900 truncate">{metadata.name}</h4>
            <p className="text-xs text-slate-500 mt-1">
              {metadata.total_rows.toLocaleString()} rows • {metadata.total_columns} columns
            </p>
          </div>

          {/* Compare Dataset Upload */}
          <div className="flex flex-col justify-center">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleUploadCompareFile(e.target.files[0]);
                }
              }}
            />

            {compareId ? (
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                    Comparison Dataset
                  </span>
                  <h4 className="font-bold text-base text-slate-900 truncate">{compareName}</h4>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 transition"
                >
                  Change CSV
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full py-4 px-6 border-2 border-dashed border-indigo-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/30 transition flex items-center justify-center gap-2 text-indigo-600 text-xs font-bold"
              >
                <UploadCloud className="w-5 h-5" />
                <span>Upload Second CSV File for Side-by-Side Comparison</span>
              </button>
            )}
          </div>
        </div>

        {/* Optional Key Match Selector */}
        {compareId && (
          <div className="pt-4 mt-4 border-t border-[#E7EAF2] flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Record Match Key (Optional):</span>
            <select
              value={keyColumn}
              onChange={(e) => setKeyColumn(e.target.value)}
              className="bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium"
            >
              <option value="">No key (Schema & Aggregates only)</option>
              {metadata.columns.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={handleRerunComparison}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
            >
              {isLoading ? "Recalculating..." : "Run Diff Analysis"}
            </button>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {comparisonResult && (
        <div className="space-y-6">
          {/* Top Delta Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card-shine p-4 rounded-xl bg-white border border-[#E7EAF2]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Row Difference
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {comparisonResult.row_count_diff.diff > 0 ? "+" : ""}
                  {comparisonResult.row_count_diff.diff}
                </span>
                <span className="text-xs text-slate-500">
                  ({comparisonResult.row_count_diff.percentage_change}%)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {comparisonResult.row_count_diff.base_rows} vs {comparisonResult.row_count_diff.compare_rows}
              </p>
            </div>

            <div className="card-shine p-4 rounded-xl bg-white border border-[#E7EAF2]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Common Columns
              </span>
              <div className="text-2xl font-black text-indigo-600">
                {comparisonResult.common_columns.length}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                +{comparisonResult.added_columns.length} added, -{comparisonResult.removed_columns.length} removed
              </p>
            </div>

            <div className="card-shine p-4 rounded-xl bg-white border border-[#E7EAF2]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Duplicate Rows Diff
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {comparisonResult.duplicate_comparison.diff > 0 ? "+" : ""}
                  {comparisonResult.duplicate_comparison.diff}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Base: {comparisonResult.duplicate_comparison.base_duplicates} vs Compare: {comparisonResult.duplicate_comparison.compare_duplicates}
              </p>
            </div>

            <div className="card-shine p-4 rounded-xl bg-white border border-[#E7EAF2]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Health Score Delta
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${
                  comparisonResult.quality_score_comparison.score_diff >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}>
                  {comparisonResult.quality_score_comparison.score_diff > 0 ? "+" : ""}
                  {comparisonResult.quality_score_comparison.score_diff} pts
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {comparisonResult.quality_score_comparison.base_score} → {comparisonResult.quality_score_comparison.compare_score}/100
              </p>
            </div>
          </div>

          {/* Record-Level Diff (If key column matched) */}
          {comparisonResult.record_level_diff && (
            <div className="card-shine p-5 rounded-2xl bg-white border border-indigo-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">
                Record-Level Key Alignment (Key: '{comparisonResult.record_level_diff.key_column}')
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F8FAFC]">
                  <span className="text-slate-400 text-[10px] block">Common Keys</span>
                  <b className="text-base text-slate-900">{comparisonResult.record_level_diff.common_records_count}</b>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC]">
                  <span className="text-slate-400 text-[10px] block">New / Added Keys</span>
                  <b className="text-base text-emerald-600">+{comparisonResult.record_level_diff.added_records_count}</b>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC]">
                  <span className="text-slate-400 text-[10px] block">Removed Keys</span>
                  <b className="text-base text-rose-600">-{comparisonResult.record_level_diff.removed_records_count}</b>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC]">
                  <span className="text-slate-400 text-[10px] block">Sample Modified Records</span>
                  <b className="text-base text-amber-600">{comparisonResult.record_level_diff.sample_modified_records_count}</b>
                </div>
              </div>
            </div>
          )}

          {/* Schema Differences Table */}
          <div className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2]">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Schema Structure & Column Deltas
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {comparisonResult.added_columns.map((c) => (
                <span key={c} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  + Added: {c}
                </span>
              ))}
              {comparisonResult.removed_columns.map((c) => (
                <span key={c} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                  - Removed: {c}
                </span>
              ))}
              {comparisonResult.added_columns.length === 0 && comparisonResult.removed_columns.length === 0 && (
                <span className="text-xs text-slate-500 font-medium">
                  Identical schema structure: All {comparisonResult.common_columns.length} columns match between both datasets.
                </span>
              )}
            </div>

            {/* Numeric Means Comparison Table */}
            {comparisonResult.numeric_stat_comparison.length > 0 && (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E7EAF2]">
                    <tr>
                      <th className="p-2.5 font-bold text-slate-700">Column</th>
                      <th className="p-2.5 text-right font-bold text-slate-700">Base Mean</th>
                      <th className="p-2.5 text-right font-bold text-slate-700">Compare Mean</th>
                      <th className="p-2.5 text-right font-bold text-slate-700">Mean Difference</th>
                      <th className="p-2.5 text-right font-bold text-slate-700">Base Min - Max</th>
                      <th className="p-2.5 text-right font-bold text-slate-700">Compare Min - Max</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7EAF2] font-mono">
                    {comparisonResult.numeric_stat_comparison.map((s) => (
                      <tr key={s.column} className="hover:bg-slate-50">
                        <td className="p-2.5 font-sans font-bold text-slate-900">{s.column}</td>
                        <td className="p-2.5 text-right text-slate-600">{s.base_mean}</td>
                        <td className="p-2.5 text-right text-slate-600">{s.compare_mean}</td>
                        <td className={`p-2.5 text-right font-bold ${
                          s.mean_diff > 0 ? "text-emerald-600" : s.mean_diff < 0 ? "text-rose-600" : "text-slate-500"
                        }`}>
                          {s.mean_diff > 0 ? "+" : ""}{s.mean_diff}
                        </td>
                        <td className="p-2.5 text-right text-slate-500">{s.base_min} – {s.base_max}</td>
                        <td className="p-2.5 text-right text-slate-500">{s.compare_min} – {s.compare_max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
