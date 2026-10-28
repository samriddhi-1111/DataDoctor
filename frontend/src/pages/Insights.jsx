import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  Lightbulb,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Filter,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { api } from "../services/api";

export function Insights() {
  const { datasetId, metadata } = useOutletContext();
  const [insights, setInsights] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!datasetId) return;
    const fetchInsights = async () => {
      setIsLoading(true);
      try {
        const res = await api.getInsights(datasetId);
        setInsights(res.insights || []);
      } catch (err) {
        console.error("Failed to load insights", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, [datasetId, metadata?.updated_at]);

  if (!datasetId || !metadata) {
    return (
      <div className="card-shine rounded-3xl p-8 bg-white border border-[#E7EAF2] text-center max-w-xl mx-auto my-12">
        <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Dataset Active</h3>
        <p className="text-xs text-slate-500 mb-4">
          Please upload or load a dataset to detect insights and anomalies.
        </p>
        <Link to="/" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
          Go to Overview
        </Link>
      </div>
    );
  }

  const filtered = insights.filter((item) => {
    const matchesSev = filterSeverity === "all" || item.severity === filterSeverity;
    const matchesCat = filterCategory === "all" || item.category === filterCategory;
    return matchesSev && matchesCat;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            <span>Automated Insights & Anomalies</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rule-based algorithmic heuristics detecting distribution skews, collinear features, and statistical anomalies.
          </p>
        </div>

        <Link
          to="/cleaning"
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-indigo-200"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apply Remediation</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="card-shine p-4 rounded-2xl bg-white border border-[#E7EAF2] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">Filter By:</span>

          {/* Severity */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E7EAF2] rounded-lg px-2.5 py-1 text-slate-700 font-medium"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          {/* Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E7EAF2] rounded-lg px-2.5 py-1 text-slate-700 font-medium"
          >
            <option value="all">All Categories</option>
            <option value="anomaly">Outliers & Anomalies</option>
            <option value="distribution">Distribution Skew</option>
            <option value="correlation">Correlation & Collinearity</option>
            <option value="cardinality">Cardinality & Keys</option>
            <option value="missing">Data Sparsity</option>
            <option value="cleaning">Cleaning Operations</option>
          </select>
        </div>

        <div className="text-slate-500 font-medium">
          Showing <b className="text-slate-900">{filtered.length}</b> of{" "}
          <b className="text-slate-900">{insights.length}</b> generated findings
        </div>
      </div>

      {/* Insight Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-semibold text-indigo-600 flex items-center justify-center gap-2">
          <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Analyzing dataset patterns and evaluating statistical rules...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-shine p-12 rounded-2xl bg-white border border-[#E7EAF2] text-center text-xs text-slate-400">
          No findings matching the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2] flex flex-col justify-between space-y-4 hover:border-indigo-300"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge type={item.severity} size="sm">
                      {item.severity}
                    </Badge>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {item.category}
                    </span>
                  </div>
                  {item.metric_value !== null && item.metric_value !== undefined && (
                    <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {String(item.metric_value)}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1.5">
                  {item.title}
                </h3>

                {item.column && (
                  <div className="text-[11px] text-slate-500 mb-2">
                    Attribute: <code className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{item.column}</code>
                  </div>
                )}

                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.explanation}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E7EAF2] flex items-center justify-between text-xs">
                <span className="text-indigo-600 font-semibold text-[11px]">
                  → {item.suggested_action}
                </span>
                <Link
                  to="/cleaning"
                  className="text-slate-400 hover:text-indigo-600 transition flex items-center gap-1 text-[11px]"
                >
                  <span>Fix</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
