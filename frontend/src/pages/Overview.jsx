import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  HeartPulse,
  Database,
  Layers,
  AlertTriangle,
  Copy,
  Hash,
  Shapes,
  HardDrive,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Lightbulb,
  FileDown,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { MetricCard } from "../components/ui/MetricCard";
import { Badge } from "../components/ui/Badge";
import { UploadDropzone } from "../components/upload/UploadDropzone";
import { api } from "../services/api";

const PIE_COLORS = ["#4F46E5", "#0F9F78", "#D97706", "#DC4C64", "#2563EB", "#8B5CF6"];

export function Overview() {
  const { datasetId, metadata, refreshDataset, handleDemoLoad } = useOutletContext();
  const [qualityData, setQualityData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [cleaningHistory, setCleaningHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!datasetId) return;
    const fetchOverviewData = async () => {
      setIsLoading(true);
      try {
        const [qRes, insRes, histRes] = await Promise.all([
          api.getQualityAnalysis(datasetId),
          api.getInsights(datasetId),
          api.getCleaningHistory(datasetId),
        ]);
        setQualityData(qRes);
        setInsights(insRes.insights || []);
        setCleaningHistory(histRes || []);
      } catch (err) {
        console.error("Error loading overview data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverviewData();
  }, [datasetId, metadata?.updated_at]);

  // If no dataset loaded, display the premium Welcome / Empty State
  if (!datasetId || !metadata) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Hero Banner */}
        <div className="card-shine rounded-3xl p-8 sm:p-12 bg-white border border-[#E7EAF2] text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Intelligent Dataset Profiler & Quality Studio</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Diagnose your data. <span className="text-indigo-600">Fix what matters.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            DataDoctor is a comprehensive Python dataset analysis platform. Upload any CSV to detect missingness, statistical outliers, schema discrepancies, and clean data with full undo and audit trails.
          </p>

          <UploadDropzone
            onUploaded={(meta) => refreshDataset(meta.dataset_id)}
            onDemoClick={handleDemoLoad}
          />
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="card-shine p-6 rounded-2xl bg-white border border-[#E7EAF2]">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Data Quality Scoring
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transparent 0-100 composite index balancing completeness, uniqueness, validity, and consistency with exact point deduction rationales.
            </p>
          </div>

          <div className="card-shine p-6 rounded-2xl bg-white border border-[#E7EAF2]">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              16 Cleaning Studio Ops
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Impute with mean/median/mode, filter IQR outliers, normalize whitespace, rename, retype, and reorder with instant multi-step Undo.
            </p>
          </div>

          <div className="card-shine p-6 rounded-2xl bg-white border border-[#E7EAF2]">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Audit Reports & Charts
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate 15 dynamic charts, dataset comparison diffs, and downloadable academic PDF audit reports built natively with ReportLab.
            </p>
          </div>
        </div>

        {/* Preview of Report */}
        <div className="max-w-4xl mx-auto p-6 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/30 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
            Sample Preview
          </span>
          <p className="text-xs text-slate-600 mt-2">
            Click <b>"Try Demo Dataset"</b> above to immediately test DataDoctor with a 550+ row synthetic e-commerce dataset containing realistic anomalies.
          </p>
        </div>
      </div>
    );
  }

  // Active Dataset Dashboard View
  const missingByColData = (qualityData?.missing_by_column || [])
    .filter((c) => c.missing_count > 0)
    .slice(0, 8);

  const typeDistributionData = Object.entries(qualityData?.type_distribution || {}).map(
    ([name, value]) => ({ name, value })
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Dataset Health Header */}
      <div className="card-shine p-6 rounded-2xl bg-white border border-[#E7EAF2] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-extrabold text-slate-900">
              {metadata.name}
            </h2>
            <Badge type="info">Active Session</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Uploaded on {new Date(metadata.created_at).toLocaleDateString()} • In-memory workspace session ID: <code className="font-mono text-slate-700 font-semibold">{datasetId}</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/explorer"
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Explore Rows</span>
          </Link>
          <Link
            to="/cleaning"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-indigo-200"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Clean Data</span>
          </Link>
        </div>
      </div>

      {/* 8 Primary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Total Records"
          value={metadata.total_rows.toLocaleString()}
          subtitle="Complete row observations"
          icon={Layers}
          color="primary"
        />
        <MetricCard
          title="Total Features"
          value={metadata.total_columns}
          subtitle={`${metadata.numerical_columns_count} num, ${metadata.categorical_columns_count} cat`}
          icon={Hash}
          color="blue"
        />
        <MetricCard
          title="Missing Cells"
          value={metadata.missing_cells_total.toLocaleString()}
          subtitle={`${metadata.missing_cells_percentage}% total sparsity`}
          icon={AlertTriangle}
          color={metadata.missing_cells_total > 0 ? "warning" : "success"}
        />
        <MetricCard
          title="Duplicate Rows"
          value={metadata.duplicate_rows_count.toLocaleString()}
          subtitle={`${metadata.duplicate_rows_percentage}% redundant tuples`}
          icon={Copy}
          color={metadata.duplicate_rows_count > 0 ? "error" : "success"}
        />
        <MetricCard
          title="Numerical Columns"
          value={metadata.numerical_columns_count}
          subtitle="Continuous & discrete metrics"
          icon={TrendingUp}
          color="violet"
        />
        <MetricCard
          title="Categorical Columns"
          value={metadata.categorical_columns_count}
          subtitle="Labels and class attributes"
          icon={Shapes}
          color="primary"
        />
        <MetricCard
          title="Memory Footprint"
          value={metadata.memory_usage_formatted}
          subtitle="Calculated deep RAM usage"
          icon={HardDrive}
          color="blue"
        />
        <MetricCard
          title="Data Health Score"
          value={qualityData ? `${qualityData.overall_score}/100` : "—"}
          subtitle={qualityData ? `Rating: ${qualityData.severity_label}` : "Calculating..."}
          icon={HeartPulse}
          color={
            (qualityData?.overall_score || 0) >= 85
              ? "success"
              : (qualityData?.overall_score || 0) >= 65
              ? "warning"
              : "error"
          }
        />
      </div>

      {/* Charts & Diagnostics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Missing Values Breakdown Chart */}
        <div className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2] lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Missing Values by Column
              </h3>
              <p className="text-[11px] text-slate-400">
                Attributes requiring imputation or cleaning
              </p>
            </div>
            <Link
              to="/quality"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Quality Diagnostics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            {missingByColData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mb-2" />
                <span className="text-xs font-semibold text-slate-700">
                  Zero Missing Values!
                </span>
                <span className="text-[11px] text-slate-400">
                  All columns in this dataset are 100% populated.
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={missingByColData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="column"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E7EAF2",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    }}
                  />
                  <Bar dataKey="missing_count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Feature Types Composition Chart */}
        <div className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2] flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Attribute Type Composition
            </h3>
            <p className="text-[11px] text-slate-400">
              Inferred data types across schema
            </p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {typeDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {typeDistributionData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E7EAF2",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400">Loading...</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E7EAF2]">
            {typeDistributionData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="text-slate-600 capitalize truncate">
                  {entry.name}: <b className="text-slate-900">{entry.value}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights and Recent Cleaning History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Automated Insights */}
        <div className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Automated Diagnostic Findings
              </h3>
            </div>
            <Link
              to="/insights"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All ({insights.length})
            </Link>
          </div>

          <div className="space-y-3">
            {insights.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No significant statistical anomalies detected in current dataset.
              </p>
            ) : (
              insights.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-100 bg-[#F8FAFC] flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {item.title}
                    </span>
                    <Badge type={item.severity} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.explanation}
                  </p>
                  <div className="text-[11px] text-indigo-600 font-semibold pt-1">
                    → Recommendation: {item.suggested_action}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Cleaning Audit Log */}
        <div className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Recent Cleaning Activity
              </h3>
            </div>
            <Link
              to="/cleaning"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Cleaning Studio
            </Link>
          </div>

          <div className="space-y-2.5">
            {cleaningHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400 mb-2">
                  No transformations applied to active dataset yet.
                </p>
                <Link
                  to="/cleaning"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open Cleaning Studio</span>
                </Link>
              </div>
            ) : (
              cleaningHistory.slice(-4).reverse().map((entry) => (
                <div
                  key={entry.step_id}
                  className="p-2.5 rounded-xl border border-[#E7EAF2] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">
                      #{entry.step_id} {entry.operation}
                    </span>
                    {entry.column && (
                      <span className="text-slate-400 ml-1.5">
                        on <code className="font-mono text-slate-600">{entry.column}</code>
                      </span>
                    )}
                    <div className="text-[10px] text-slate-400">
                      {entry.timestamp} • Affected {entry.affected_rows} rows
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {entry.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
