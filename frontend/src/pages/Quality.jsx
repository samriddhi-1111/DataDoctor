import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  BarChart3,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "../components/ui/Badge";
import { api } from "../services/api";

export function Quality() {
  const { datasetId, metadata } = useOutletContext();
  const [qa, setQa] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (!datasetId) return;
    const fetchQuality = async () => {
      setIsLoading(true);
      try {
        const res = await api.getQualityAnalysis(datasetId);
        setQa(res);
      } catch (err) {
        console.error("Failed to fetch quality analysis", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuality();
  }, [datasetId, metadata?.updated_at]);

  if (!datasetId || !metadata) {
    return (
      <div className="card-shine rounded-3xl p-8 bg-white border border-[#E7EAF2] text-center max-w-xl mx-auto my-12">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Dataset Active</h3>
        <p className="text-xs text-slate-500 mb-4">
          Please upload or load a dataset to inspect quality diagnostics.
        </p>
        <Link
          to="/"
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Go to Overview
        </Link>
      </div>
    );
  }

  if (isLoading || !qa) {
    return (
      <div className="p-12 text-center text-xs font-semibold text-indigo-600 flex items-center justify-center gap-2">
        <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span>Computing data quality score and running diagnostics...</span>
      </div>
    );
  }

  const filteredIssues =
    selectedCategory === "all"
      ? qa.issues
      : qa.issues.filter((i) => i.category === selectedCategory);

  const missingChartData = qa.missing_by_column.filter((c) => c.missing_count > 0);
  const outlierChartData = qa.outliers_by_column || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <span>Data Quality Inspector</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Algorithmic 0–100 data health index based on completeness, uniqueness, validity, and consistency.
          </p>
        </div>

        <Link
          to="/cleaning"
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-2 shadow-sm shadow-indigo-200"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fix Issues in Cleaning Studio</span>
        </Link>
      </div>

      {/* Primary Score & 4 Dimensions Header Card */}
      <div className="card-shine p-6 rounded-3xl bg-white border border-[#E7EAF2] grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        {/* Score Circle / Badge */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-indigo-50/50 to-white border border-indigo-100 text-center">
          <div className="text-4xl sm:text-5xl font-black text-indigo-600 mb-1">
            {qa.overall_score}
            <span className="text-lg font-bold text-slate-400">/100</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-white border border-indigo-200 text-indigo-800 shadow-2xs mb-2">
            <span>Grade: {qa.severity_label}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Overall Health Index
          </p>
        </div>

        {/* 4 Dimension Breakdown Progress Bars */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Completeness */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E7EAF2]">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-bold text-slate-800">Completeness (35%)</span>
              <span className="font-mono font-semibold text-indigo-600">
                {qa.components.completeness}/100
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${qa.components.completeness}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Penalizes missing cells and sparse columns
            </p>
          </div>

          {/* Uniqueness */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E7EAF2]">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-bold text-slate-800">Uniqueness (25%)</span>
              <span className="font-mono font-semibold text-emerald-600">
                {qa.components.uniqueness}/100
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${qa.components.uniqueness}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Detects redundant and identical duplicate rows
            </p>
          </div>

          {/* Validity */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E7EAF2]">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-bold text-slate-800">Validity (25%)</span>
              <span className="font-mono font-semibold text-amber-600">
                {qa.components.validity}/100
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${qa.components.validity}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Evaluates 1.5x IQR outliers and numeric anomalies
            </p>
          </div>

          {/* Consistency */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E7EAF2]">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-bold text-slate-800">Consistency (15%)</span>
              <span className="font-mono font-semibold text-purple-600">
                {qa.components.consistency}/100
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${qa.components.consistency}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Flags zero-variance constants and casing variances
            </p>
          </div>
        </div>
      </div>

      {/* Point Deductions Explanation List */}
      {qa.deductions.length > 0 && (
        <div className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Score Deduction Rationale
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {qa.deductions.map((d, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl border border-rose-100 bg-rose-50/50 text-xs"
              >
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  <span className="text-slate-700 font-medium">
                    <b>{d.category}:</b> {d.reason}
                  </span>
                </div>
                <span className="font-mono font-bold text-rose-700 ml-2 whitespace-nowrap">
                  -{d.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Diagnostic Charts: Missingness & Outliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Values Chart */}
        <div className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2]">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Missing Values Distribution
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">
            Total missing cells per column
          </p>
          <div className="h-56 w-full">
            {missingChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No missing values in this dataset.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={missingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="column" tick={{ fontSize: 10, fill: "#64748B" }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFF",
                      borderRadius: "10px",
                      fontSize: "12px",
                      borderColor: "#E7EAF2",
                    }}
                  />
                  <Bar dataKey="missing_count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Statistical Outliers Count Chart */}
        <div className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2]">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            1.5x IQR Statistical Outliers
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">
            Extreme values exceeding interquartile fences
          </p>
          <div className="h-56 w-full">
            {outlierChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No extreme numerical outliers detected.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outlierChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="column" tick={{ fontSize: 10, fill: "#64748B" }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFF",
                      borderRadius: "10px",
                      fontSize: "12px",
                      borderColor: "#E7EAF2",
                    }}
                  />
                  <Bar dataKey="outlier_count" fill="#D97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Issues Diagnostic List with Category Filters */}
      <div className="card-shine p-6 rounded-2xl bg-white border border-[#E7EAF2]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Diagnostic Quality Issues ({qa.issues.length})
            </h3>
            <p className="text-xs text-slate-400">
              Detailed findings with severity tags and recommended remediation.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-semibold">
            {["all", "completeness", "uniqueness", "validity", "consistency"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg capitalize transition ${
                  selectedCategory === cat
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredIssues.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No issues detected in category '{selectedCategory}'.
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-4 rounded-xl border border-[#E7EAF2] hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC]/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge type={issue.severity} size="sm">
                      {issue.severity}
                    </Badge>
                    <span className="text-xs font-bold text-slate-900">
                      {issue.title}
                    </span>
                    {issue.column && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {issue.column}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    {issue.description}
                  </p>
                  <p className="text-[11px] text-indigo-600 font-semibold">
                    Suggested Action: {issue.suggested_action}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to="/cleaning"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1"
                  >
                    <span>Fix in Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
