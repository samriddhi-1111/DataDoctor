import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Shapes,
  Calendar,
  Network,
  Layers,
  ArrowUpDown,
  Search,
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

export function Analytics() {
  const { datasetId, metadata } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [correlations, setCorrelations] = useState(null);
  const [activeTab, setActiveTab] = useState("numerical"); // 'numerical' | 'categorical' | 'correlation' | 'groupby'
  const [isLoading, setIsLoading] = useState(false);

  // Group-by state
  const [groupCol, setGroupCol] = useState("");
  const [aggCol, setAggCol] = useState("");
  const [aggFn, setAggFn] = useState("mean");
  const [groupResult, setGroupResult] = useState(null);
  const [isGroupLoading, setIsGroupLoading] = useState(false);

  useEffect(() => {
    if (!datasetId) return;
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const [sRes, cRes] = await Promise.all([
          api.getStatistics(datasetId),
          api.getCorrelations(datasetId),
        ]);
        setStats(sRes);
        setCorrelations(cRes);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [datasetId, metadata?.updated_at]);

  // Set default group and agg columns
  useEffect(() => {
    if (metadata?.columns) {
      const cats = metadata.columns.filter((c) => c.inferred_type === "categorical");
      const nums = metadata.columns.filter((c) => c.inferred_type === "numeric");
      if (cats.length > 0 && !groupCol) setGroupCol(cats[0].name);
      if (nums.length > 0 && !aggCol) setAggCol(nums[0].name);
    }
  }, [metadata]);

  const handleRunGroupBy = async () => {
    if (!groupCol || !aggCol) return;
    setIsGroupLoading(true);
    try {
      const res = await api.getGroupBy(datasetId, {
        group_column: groupCol,
        agg_column: aggCol,
        agg_function: aggFn,
      });
      setGroupResult(res);
    } catch (err) {
      console.error("Group by failed", err);
    } finally {
      setIsGroupLoading(false);
    }
  };

  if (!datasetId || !metadata) {
    return (
      <div className="card-shine rounded-3xl p-8 bg-white border border-[#E7EAF2] text-center max-w-xl mx-auto my-12">
        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Dataset Active</h3>
        <p className="text-xs text-slate-500 mb-4">
          Please upload or load a dataset to view analytics and statistics.
        </p>
        <Link to="/" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
          Go to Overview
        </Link>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="p-12 text-center text-xs font-semibold text-indigo-600 flex items-center justify-center gap-2">
        <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span>Computing statistical moments and correlation matrices...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Analytics & Descriptive Statistics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Central tendency, dispersion, quartiles, category frequencies, bivariate correlation, and aggregations.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("numerical")}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "numerical" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600"
            }`}
          >
            Numerical Moments ({stats.numerical_summaries.length})
          </button>
          <button
            onClick={() => setActiveTab("categorical")}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "categorical" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600"
            }`}
          >
            Categorical Distributions ({stats.categorical_summaries.length})
          </button>
          <button
            onClick={() => setActiveTab("correlation")}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "correlation" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600"
            }`}
          >
            Pearson Correlation
          </button>
          <button
            onClick={() => setActiveTab("groupby")}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === "groupby" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600"
            }`}
          >
            Group-By Analysis
          </button>
        </div>
      </div>

      {/* 1. Numerical Moments Table */}
      {activeTab === "numerical" && (
        <div className="card-shine rounded-2xl bg-white border border-[#E7EAF2] overflow-hidden">
          <div className="p-4 border-b border-[#E7EAF2] bg-[#F8FAFC]/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Descriptive Statistics for Continuous Numerical Attributes
            </h3>
            <span className="text-xs text-slate-400">
              Calculated via NumPy & Pandas algorithms
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E7EAF2] bg-[#F8FAFC] text-slate-600">
                  <th className="py-2.5 px-3 font-semibold">Column</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Count</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Missing</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Mean</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Std Dev</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Min</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Q1 (25%)</th>
                  <th className="py-2.5 px-3 font-semibold text-right font-bold text-indigo-700">Median</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Q3 (75%)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Max</th>
                  <th className="py-2.5 px-3 font-semibold text-right">IQR</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Skewness</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Kurtosis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7EAF2] font-mono">
                {stats.numerical_summaries.map((num) => (
                  <tr key={num.column} className="hover:bg-indigo-50/20 transition">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                      {num.column}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{num.count}</td>
                    <td className="py-2.5 px-3 text-right text-amber-600">{num.missing_count}</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 font-semibold">{num.mean ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{num.std ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{num.min ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{num.q25 ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-700">{num.median ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{num.q75 ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{num.max ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{num.iqr ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{num.skewness ?? "—"}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{num.kurtosis ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Categorical Distributions */}
      {activeTab === "categorical" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.categorical_summaries.map((cat) => (
            <div
              key={cat.column}
              className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-900">{cat.column}</h4>
                  <Badge type="categorical">
                    {cat.unique_count} classes
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pb-2 border-b border-[#E7EAF2]">
                  <span>Populated: <b>{cat.count}</b></span>
                  <span>Missing: <b className="text-amber-600">{cat.missing_count}</b></span>
                  {cat.avg_string_length && (
                    <span>Avg Length: <b>{cat.avg_string_length} chars</b></span>
                  )}
                </div>

                <div className="space-y-2">
                  {cat.frequencies.map((f, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700 truncate max-w-[200px]">
                          {f.value || "<blank>"}
                        </span>
                        <span className="text-slate-500 font-mono">
                          {f.count} ({f.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, f.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Pearson Correlation Matrix */}
      {activeTab === "correlation" && correlations && (
        <div className="space-y-6">
          {correlations.strong_correlations.length > 0 && (
            <div className="card-shine p-5 rounded-2xl bg-white border border-indigo-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">
                Significant Multicollinear Correlations (|r| ≥ 0.65)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {correlations.strong_correlations.map((sc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-800">
                        {sc.col1} ↔ {sc.col2}
                      </span>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {sc.strength} ({sc.type})
                      </div>
                    </div>
                    <span className="font-mono font-bold text-indigo-700 text-sm">
                      r = {sc.coefficient}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2] overflow-x-auto">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Pearson Bivariate Correlation Matrix
            </h3>
            <table className="w-full text-center text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E7EAF2]">
                  <th className="p-2 text-left font-sans font-bold text-slate-700">Feature</th>
                  {correlations.columns.map((col) => (
                    <th key={col} className="p-2 text-slate-600 font-sans font-semibold text-[11px] truncate max-w-[100px]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7EAF2]">
                {correlations.columns.map((rowCol, rIdx) => (
                  <tr key={rowCol}>
                    <td className="p-2 text-left font-sans font-bold text-slate-800 whitespace-nowrap bg-[#F8FAFC]/50">
                      {rowCol}
                    </td>
                    {correlations.columns.map((colCol, cIdx) => {
                      const val = correlations.matrix[rIdx][cIdx];
                      const isHigh = val !== null && Math.abs(val) >= 0.70 && rIdx !== cIdx;
                      return (
                        <td
                          key={colCol}
                          className={`p-2 transition ${
                            rIdx === cIdx
                              ? "bg-slate-100 font-bold text-slate-400"
                              : isHigh
                              ? "bg-indigo-100 text-indigo-900 font-bold"
                              : val > 0
                              ? "text-indigo-700"
                              : val < 0
                              ? "text-rose-600"
                              : "text-slate-400"
                          }`}
                        >
                          {val !== null ? val.toFixed(2) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Group-By Analysis Lab */}
      {activeTab === "groupby" && (
        <div className="card-shine p-6 rounded-2xl bg-white border border-[#E7EAF2] space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Group By (Category)
              </label>
              <select
                value={groupCol}
                onChange={(e) => setGroupCol(e.target.value)}
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs font-medium text-slate-800"
              >
                {metadata.columns
                  .filter((c) => c.inferred_type === "categorical" || c.inferred_type === "text")
                  .map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Metric Column
              </label>
              <select
                value={aggCol}
                onChange={(e) => setAggCol(e.target.value)}
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs font-medium text-slate-800"
              >
                {metadata.columns
                  .filter((c) => c.inferred_type === "numeric")
                  .map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Aggregation Function
              </label>
              <select
                value={aggFn}
                onChange={(e) => setAggFn(e.target.value)}
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="mean">Mean (Average)</option>
                <option value="sum">Sum (Total)</option>
                <option value="count">Count (Frequency)</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
                <option value="median">Median (50th percentile)</option>
              </select>
            </div>

            <button
              onClick={handleRunGroupBy}
              disabled={isGroupLoading || !groupCol || !aggCol}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
            >
              {isGroupLoading ? "Calculating..." : "Compute Group By"}
            </button>
          </div>

          {/* Group-By Results */}
          {groupResult && groupResult.data.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[#E7EAF2]">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupResult.data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis dataKey="group" tick={{ fontSize: 10, fill: "#64748B" }} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFF",
                        borderColor: "#E7EAF2",
                        borderRadius: "10px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="value" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-y-auto max-h-64 border border-[#E7EAF2] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E7EAF2]">
                    <tr>
                      <th className="p-2.5 font-bold text-slate-700">{groupResult.group_column}</th>
                      <th className="p-2.5 font-bold text-slate-700 text-right">
                        {groupResult.agg_function.toUpperCase()}({groupResult.agg_column})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7EAF2]">
                    {groupResult.data.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-slate-800">{r.group}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-indigo-700">
                          {r.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
