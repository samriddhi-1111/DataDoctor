import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  FileDown,
  FileText,
  Download,
  BookOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../components/ui/Toast";
import { api } from "../services/api";

export function Reports() {
  const { datasetId, metadata } = useOutletContext();
  const { showToast } = useToast();

  const [dictionary, setDictionary] = useState([]);
  const [activeTab, setActiveTab] = useState("exports"); // 'exports' | 'dictionary'
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!datasetId) return;
    const fetchDictionary = async () => {
      setIsLoading(true);
      try {
        const res = await api.getDataDictionary(datasetId);
        setDictionary(res.columns || []);
      } catch (err) {
        console.error("Failed to load dictionary", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDictionary();
  }, [datasetId, metadata?.updated_at]);

  const handleDownloadPdf = async () => {
    if (!datasetId) return;
    setIsPdfGenerating(true);
    try {
      const url = api.exportPdfUrl(datasetId);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to generate PDF audit report");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `DataDoctor_Audit_Report_${datasetId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      showToast("PDF Audit Report generated and downloaded successfully!", "success");
    } catch (err) {
      showToast(err.message || "PDF download failed", "error");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleDownloadCsv = (type, title) => {
    if (!datasetId) return;
    const url = api.exportCsvUrl(datasetId, type);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DataDoctor_${type}_${datasetId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Exported ${title} as CSV!`, "success");
  };

  if (!datasetId || !metadata) {
    return (
      <div className="card-shine rounded-3xl p-8 bg-white border border-[#E7EAF2] text-center max-w-xl mx-auto my-12">
        <FileDown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Dataset Active</h3>
        <p className="text-xs text-slate-500 mb-4">
          Please upload or load a dataset to access reports and export downloads.
        </p>
        <Link to="/" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
          Go to Overview
        </Link>
      </div>
    );
  }

  const exportCards = [
    {
      id: "cleaned",
      title: "Cleaned Working Dataset",
      desc: "Full dataset with all active imputations, whitespace cleanups, and outlier filters applied.",
      type: "cleaned",
      badge: "Primary Data",
    },
    {
      id: "quality_issues",
      title: "Data Quality Issues & Deductions",
      desc: "Structured list of detected quality warnings, affected row counts, and remediation advice.",
      type: "quality_issues",
      badge: "Diagnostics",
    },
    {
      id: "statistics",
      title: "Summary Descriptive Statistics",
      desc: "Numerical statistical moments: mean, std dev, quartiles (Q1, Q3), IQR, skewness, and kurtosis.",
      type: "statistics",
      badge: "Analytics",
    },
    {
      id: "frequencies",
      title: "Categorical Frequency Tables",
      desc: "Class distribution breakdown, occurrences, and relative proportions for all categorical attributes.",
      type: "frequencies",
      badge: "Distributions",
    },
    {
      id: "outliers",
      title: "1.5x IQR Outlier Records",
      desc: "Exact raw records identified as extreme statistical anomalies exceeding interquartile fences.",
      type: "outliers",
      badge: "Anomalies",
    },
    {
      id: "history",
      title: "Cleaning Audit Trail History",
      desc: "Chronological log of every transformation executed with before/after row impacts and timestamps.",
      type: "history",
      badge: "Audit Trail",
    },
    {
      id: "dictionary",
      title: "Data Dictionary Specification",
      desc: "Comprehensive metadata schema detailing inferred types, null counts, and rule-based descriptions.",
      type: "dictionary",
      badge: "Documentation",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <FileDown className="w-6 h-6 text-indigo-600" />
            <span>Reports & Export Center</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Download comprehensive academic PDF audit reports, cleaned CSV datasets, and inspection dictionaries.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("exports")}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === "exports" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600"
            }`}
          >
            Export Center
          </button>
          <button
            onClick={() => setActiveTab("dictionary")}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === "dictionary" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600"
            }`}
          >
            Data Dictionary ({dictionary.length})
          </button>
        </div>
      </div>

      {activeTab === "exports" ? (
        <div className="space-y-6">
          {/* Featured Academic PDF Report Banner */}
          <div className="card-shine p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 to-indigo-800 text-white border border-indigo-700 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-700/50">
                Official Dataset Quality Audit
              </span>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                Download Comprehensive PDF Audit Report
              </h3>
              <p className="text-xs text-indigo-200 max-w-xl leading-relaxed">
                Includes executive summary, multi-dimensional data quality score breakdown, diagnostic issues table, numerical descriptive statistics, automated insights, and cleaning audit logs generated directly via ReportLab.
              </p>
            </div>

            <button
              onClick={handleDownloadPdf}
              disabled={isPdfGenerating}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-indigo-900 font-extrabold text-xs sm:text-sm shadow-md transition flex items-center gap-2 flex-shrink-0"
            >
              {isPdfGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" />
                  <span>Compiling PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Download Audit PDF</span>
                </>
              )}
            </button>
          </div>

          {/* CSV Exports Grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Downloadable CSV Data Products
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exportCards.map((card) => (
                <div
                  key={card.id}
                  className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {card.badge}
                      </span>
                      <Download className="w-4 h-4 text-slate-400" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 mb-1">
                      {card.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      {card.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDownloadCsv(card.type, card.title)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Data Dictionary Table */
        <div className="card-shine rounded-2xl bg-white border border-[#E7EAF2] overflow-hidden">
          <div className="p-4 border-b border-[#E7EAF2] bg-[#F8FAFC]/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Data Dictionary for '{metadata.name}'
              </h3>
              <p className="text-xs text-slate-400">
                Rule-based analytical specification generated from actual data values
              </p>
            </div>
            <button
              onClick={() => handleDownloadCsv("dictionary", "Data Dictionary")}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Dictionary CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E7EAF2] text-slate-700">
                  <th className="py-2.5 px-3 font-semibold">Column Name</th>
                  <th className="py-2.5 px-3 font-semibold">Inferred Type</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Non-Null</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Missing (%)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Unique</th>
                  <th className="py-2.5 px-3 font-semibold">Value Range / Top Classes</th>
                  <th className="py-2.5 px-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7EAF2]">
                {dictionary.map((item) => (
                  <tr key={item.column_name} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {item.column_name}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge type={item.inferred_type} size="sm">
                        {item.inferred_type}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {item.non_null_count}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-600">
                      {item.missing_percentage}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {item.unique_count}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-[200px] truncate">
                      {item.range_or_top_categories}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-[280px]">
                      {item.rule_based_description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
