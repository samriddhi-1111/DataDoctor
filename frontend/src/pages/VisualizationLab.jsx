import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  LineChart as LineChartIcon,
  BarChart3,
  PieChart as PieChartIcon,
  ScatterChart,
  AreaChart as AreaChartIcon,
  BookmarkPlus,
  Trash2,
  Download,
  Sparkles,
  Sliders,
  Maximize2,
  Box,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart as RechartsScatter,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "../components/ui/Toast";
import { api } from "../services/api";

const CHART_TYPES = [
  { id: "bar", name: "Bar Chart", icon: BarChart3, reqY: false },
  { id: "line", name: "Line Chart", icon: LineChartIcon, reqY: true },
  { id: "area", name: "Area Chart", icon: AreaChartIcon, reqY: true },
  { id: "histogram", name: "Histogram", icon: BarChart3, reqY: false },
  { id: "scatter", name: "Scatter Plot", icon: ScatterChart, reqY: true },
  { id: "bubble", name: "Bubble Chart", icon: ScatterChart, reqY: true },
  { id: "pie", name: "Pie Chart", icon: PieChartIcon, reqY: false },
  { id: "donut", name: "Donut Chart", icon: PieChartIcon, reqY: false },
  { id: "box", name: "Box Plot", icon: Box, reqY: true },
  { id: "violin", name: "Violin Density", icon: LineChartIcon, reqY: true },
  { id: "correlation", name: "Correlation Heatmap", icon: BarChart3, reqY: false },
  { id: "missing_values", name: "Missingness Bar", icon: BarChart3, reqY: false },
  { id: "count", name: "Count Plot", icon: BarChart3, reqY: false },
  { id: "time_series", name: "Time Series", icon: LineChartIcon, reqY: true },
  { id: "3d_scatter", name: "3D Scatter (X/Y/Z)", icon: ScatterChart, reqY: true },
];

const COLORS = ["#4F46E5", "#0F9F78", "#D97706", "#DC4C64", "#2563EB", "#8B5CF6", "#EC4899", "#14B8A6"];

export function VisualizationLab() {
  const { datasetId, metadata } = useOutletContext();
  const { showToast } = useToast();

  const [chartType, setChartType] = useState("bar");
  const [xCol, setXCol] = useState("");
  const [yCol, setYCol] = useState("");
  const [zCol, setZCol] = useState("");
  const [groupCol, setGroupCol] = useState("");
  const [aggregation, setAggregation] = useState("mean");
  const [chartTitle, setChartTitle] = useState("");
  
  const [chartResponse, setChartResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedCharts, setSavedCharts] = useState([]);

  useEffect(() => {
    if (metadata?.columns?.length > 0) {
      const nums = metadata.columns.filter((c) => c.inferred_type === "numeric");
      const cats = metadata.columns.filter((c) => c.inferred_type === "categorical");
      const dates = metadata.columns.filter((c) => c.inferred_type === "datetime");

      if (cats.length > 0 && !xCol) setXCol(cats[0].name);
      else if (nums.length > 0 && !xCol) setXCol(nums[0].name);

      if (nums.length > 0 && !yCol) setYCol(nums[0].name);
      if (nums.length > 1 && !zCol) setZCol(nums[1].name);
      if (cats.length > 1 && !groupCol) setGroupCol(cats[1].name);
    }
  }, [metadata]);

  const fetchChart = async () => {
    if (!datasetId) return;
    setIsLoading(true);
    try {
      const res = await api.getVisualizationData(datasetId, {
        chart_type: chartType,
        x_column: xCol || null,
        y_column: yCol || null,
        z_column: zCol || null,
        group_column: groupCol || null,
        aggregation: aggregation,
        title: chartTitle || null,
      });
      setChartResponse(res);
    } catch (err) {
      showToast(err.message || "Failed to render chart", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (xCol) {
      fetchChart();
    }
  }, [chartType, xCol, yCol, zCol, groupCol, aggregation]);

  const saveCurrentChart = () => {
    if (!chartResponse) return;
    const item = {
      id: Date.now(),
      type: chartType,
      title: chartResponse.title,
      x: xCol,
      y: yCol,
      data: chartResponse.data,
    };
    setSavedCharts((prev) => [item, ...prev]);
    showToast("Chart configuration saved to current session!", "success");
  };

  const removeSavedChart = (id) => {
    setSavedCharts((prev) => prev.filter((c) => c.id !== id));
  };

  const exportChartDataCsv = () => {
    if (!chartResponse || !chartResponse.data) return;
    const data = chartResponse.data;
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DataDoctor_${chartType}_chart_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Chart points exported as CSV!", "success");
  };

  if (!datasetId || !metadata) {
    return (
      <div className="card-shine rounded-3xl p-8 bg-white border border-[#E7EAF2] text-center max-w-xl mx-auto my-12">
        <LineChartIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Dataset Active</h3>
        <p className="text-xs text-slate-500 mb-4">
          Please upload or load a dataset to build interactive charts.
        </p>
        <Link to="/" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
          Go to Overview
        </Link>
      </div>
    );
  }

  // Render chart based on selected type
  const renderActiveChart = () => {
    if (!chartResponse || !chartResponse.data || chartResponse.data.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-xs text-slate-400">
          No data available for this configuration.
        </div>
      );
    }

    const d = chartResponse.data;

    switch (chartType) {
      case "line":
      case "time_series":
        return (
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={d} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
              <XAxis dataKey="x" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF",
                  borderColor: "#E7EAF2",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line type="monotone" dataKey="y" stroke="#4F46E5" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={d} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
              <XAxis dataKey="x" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip contentStyle={{ backgroundColor: "#FFF", borderRadius: "12px" }} />
              <Area type="monotone" dataKey="y" stroke="#4F46E5" fill="#EEF2FF" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "histogram":
        return (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={d} margin={{ top: 20, right: 30, left: 10, bottom: 35 }}>
              <XAxis dataKey="bin" tick={{ fontSize: 10, fill: "#64748B" }} angle={-25} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip contentStyle={{ backgroundColor: "#FFF", borderRadius: "12px" }} />
              <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "scatter":
      case "bubble":
      case "3d_scatter":
        return (
          <ResponsiveContainer width="100%" height={380}>
            <RechartsScatter data={d} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
              <XAxis
                dataKey="x"
                type={typeof d[0]?.x === "number" ? "number" : "category"}
                tick={{ fontSize: 11, fill: "#64748B" }}
                name={xCol}
              />
              <YAxis
                dataKey="y"
                type={typeof d[0]?.y === "number" ? "number" : "category"}
                tick={{ fontSize: 11, fill: "#64748B" }}
                name={yCol}
              />
              {chartType === "bubble" && <ZAxis dataKey="size" range={[60, 400]} name="Size" />}
              <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ backgroundColor: "#FFF", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Scatter name="Observations" data={d} fill="#4F46E5" />
            </RechartsScatter>
          </ResponsiveContainer>
        );

      case "pie":
      case "donut":
        return (
          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <Pie
                data={d}
                cx="50%"
                cy="50%"
                innerRadius={chartType === "donut" ? 65 : 0}
                outerRadius={115}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {d.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#FFF", borderRadius: "12px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(val) => [
                  `${Number(val).toLocaleString()} (${((Number(val) / (d.reduce((acc, cur) => acc + (Number(cur.value) || 0), 0) || 1)) * 100).toFixed(1)}%)`,
                  yCol ? `${yCol} (${aggregation})` : "Count"
                ]}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        );

      case "box":
        return (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {d.map((item, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-[#F8FAFC]">
                  <span className="font-bold text-xs text-slate-800 block mb-2">{item.group}</span>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Max (Upper Fence):</span> <b>{item.max}</b>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Q3 (75th):</span> <b>{item.q3}</b>
                    </div>
                    <div className="flex justify-between text-indigo-700 font-bold bg-indigo-50 px-1 py-0.5 rounded">
                      <span>Median:</span> <b>{item.median}</b>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Q1 (25th):</span> <b>{item.q1}</b>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Min (Lower Fence):</span> <b>{item.min}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "violin":
        return (
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={d} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
              <XAxis dataKey="val" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip contentStyle={{ backgroundColor: "#FFF", borderRadius: "12px" }} />
              <Area type="natural" dataKey="density" stroke="#8B5CF6" fill="#EDE9FE" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "correlation":
      case "missing_values":
      case "count":
      case "bar":
      default:
        return (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={d} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
              <XAxis dataKey={chartType === "count" ? "category" : "x"} tick={{ fontSize: 10, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#FFF", borderRadius: "12px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(value) => [value, yCol ? `${yCol} (${aggregation})` : "Count"]}
                labelFormatter={(label) => `${xCol || 'Category'}: ${label}`}
              />
              <Bar
                dataKey={chartType === "count" ? "count" : "y"}
                name={yCol ? `${yCol} (${aggregation})` : "Frequency"}
                fill="#4F46E5"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <LineChartIcon className="w-6 h-6 text-indigo-600" />
            <span>Visualization Lab</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Build, configure, and save 15 responsive statistical charts computed live from the active dataset.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={saveCurrentChart}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-[#E7EAF2] hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Save Chart</span>
          </button>
          <button
            onClick={exportChartDataCsv}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-[#E7EAF2] hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Chart Selector Carousel / Pills */}
      <div className="p-2 rounded-2xl bg-white border border-[#E7EAF2] overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {CHART_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setChartType(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  chartType === t.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Config Bar & Live Chart Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chart Configuration Form Panel */}
        <div className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2] space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Chart Parameters
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              X-Axis Attribute
            </label>
            <select
              value={xCol}
              onChange={(e) => setXCol(e.target.value)}
              className="w-full p-2 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs font-medium text-slate-800"
            >
              {metadata.columns.map((c) => (
                <option key={c.name} value={c.name}>{c.name} ({c.inferred_type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Y-Axis Metric
            </label>
            <select
              value={yCol}
              onChange={(e) => {
                const val = e.target.value;
                setYCol(val);
                if (val && (aggregation === "none" || aggregation === "count")) {
                  setAggregation("mean");
                }
              }}
              className="w-full p-2 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs font-medium text-slate-800"
            >
              <option value="">None / Frequency Count</option>
              {metadata.columns.map((c) => (
                <option key={c.name} value={c.name}>{c.name} ({c.inferred_type})</option>
              ))}
            </select>
          </div>

          {chartType === "3d_scatter" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Z-Axis Metric
              </label>
              <select
                value={zCol}
                onChange={(e) => setZCol(e.target.value)}
                className="w-full p-2 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs font-medium text-slate-800"
              >
                {metadata.columns.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Group / Color Column
            </label>
            <select
              value={groupCol}
              onChange={(e) => setGroupCol(e.target.value)}
              className="w-full p-2 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs font-medium text-slate-800"
            >
              <option value="">None</option>
              {metadata.columns.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Aggregation Mode
            </label>
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value)}
              className="w-full p-2 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs font-medium text-slate-800"
            >
              <option value="mean">Mean (Average)</option>
              <option value="sum">Sum (Total)</option>
              <option value="median">Median (50th percentile)</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
              <option value="count">Count (Frequency)</option>
              <option value="none">None (Raw points)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chart Title
            </label>
            <input
              type="text"
              placeholder="Custom chart title..."
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              className="w-full p-2 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs text-slate-800"
            />
          </div>

          <button
            onClick={fetchChart}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            {isLoading ? "Rendering..." : "Update Visualization"}
          </button>
        </div>

        {/* Live Chart Rendering Stage */}
        <div className="card-shine p-6 rounded-2xl bg-white border border-[#E7EAF2] lg:col-span-3 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7EAF2] mb-4">
            <h3 className="font-bold text-base text-slate-900 truncate">
              {chartResponse?.title || "Interactive Visualization"}
            </h3>
            <span className="text-xs text-slate-400 capitalize">
              Type: {chartType.replace("_", " ")}
            </span>
          </div>

          <div className="flex-1 w-full min-h-[380px] relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs z-10 flex items-center justify-center">
                <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {renderActiveChart()}
          </div>
        </div>
      </div>

      {/* Saved Charts Gallery */}
      {savedCharts.length > 0 && (
        <div className="card-shine p-6 rounded-2xl bg-white border border-[#E7EAF2]">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            Saved Visualizations ({savedCharts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedCharts.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {item.title}
                    </span>
                    <button
                      onClick={() => removeSavedChart(item.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {item.type} • {item.x} vs {item.y || "count"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
