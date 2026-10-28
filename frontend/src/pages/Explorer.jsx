import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  TableProperties,
  Search,
  Filter,
  Columns,
  Hash,
  Shapes,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { DataTable } from "../components/tables/DataTable";
import { Badge } from "../components/ui/Badge";
import { UploadDropzone } from "../components/upload/UploadDropzone";

export function Explorer() {
  const { datasetId, metadata, refreshDataset, handleDemoLoad } = useOutletContext();
  const [activeTab, setActiveTab] = useState("table"); // 'table' | 'columns'

  if (!datasetId || !metadata) {
    return (
      <div className="card-shine rounded-3xl p-8 bg-white border border-[#E7EAF2] text-center max-w-2xl mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Dataset Explorer
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Upload a CSV or load the demo dataset to inspect rows, data types, and null distributions.
        </p>
        <UploadDropzone
          onUploaded={(meta) => refreshDataset(meta.dataset_id)}
          onDemoClick={handleDemoLoad}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <TableProperties className="w-6 h-6 text-indigo-600" />
            <span>Dataset Explorer</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Interactive tabular inspection, full-text searching, multi-column sorting, and attribute profiling.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("table")}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === "table"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tabular View
          </button>
          <button
            onClick={() => setActiveTab("columns")}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === "columns"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Column Inspector ({metadata.columns.length})
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "table" ? (
        <DataTable datasetId={datasetId} totalRows={metadata.total_rows} />
      ) : (
        /* Column Inspector Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metadata.columns.map((col) => (
            <div
              key={col.name}
              className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {col.name}
                  </h4>
                  <Badge type={col.inferred_type} size="sm">
                    {col.inferred_type}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mb-4">
                  Pandas dtype: {col.dtype}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-[#E7EAF2] mb-3">
                  <div>
                    <span className="text-slate-400 text-[11px]">Missing:</span>
                    <div className="font-bold text-slate-800">
                      {col.null_count}{" "}
                      <span className="text-slate-400 text-[10px] font-normal">
                        ({col.null_percentage}%)
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Cardinality:</span>
                    <div className="font-bold text-slate-800">
                      {col.unique_count.toLocaleString()}{" "}
                      <span className="text-slate-400 text-[10px] font-normal">
                        unique
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Sample Values:
                </span>
                <div className="flex flex-wrap gap-1">
                  {col.sample_values.map((val, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-mono truncate max-w-[120px]"
                    >
                      {String(val)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
