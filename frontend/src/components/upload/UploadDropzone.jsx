import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Sparkles, Play } from "lucide-react";
import { api } from "../../services/api";
import { useToast } from "../ui/Toast";

export function UploadDropzone({ onUploaded, onDemoClick }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only CSV (.csv) files are supported.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File exceeds 50MB limit.");
      return;
    }

    setIsUploading(true);
    try {
      const meta = await api.uploadCsv(file);
      showToast(`Uploaded ${meta.name} successfully!`, "success");
      if (onUploaded) onUploaded(meta);
    } catch (err) {
      setError(err.message || "Failed to upload file.");
      showToast(err.message || "Upload failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-indigo-600 bg-indigo-50/60 scale-[1.01]"
            : "border-[#D3D9E9] bg-white hover:border-indigo-400 hover:bg-slate-50/50"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm border border-indigo-100">
          <UploadCloud className="w-8 h-8 stroke-[1.8]" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
          Upload your CSV dataset
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
          Drag and drop your file here, or browse from your computer. Supports up to 50MB.
        </p>

        {isUploading ? (
          <div className="flex items-center justify-center gap-3 text-indigo-600 font-semibold text-sm">
            <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Analyzing dataset structure & quality...</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs sm:text-sm hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition"
            >
              Browse CSV File
            </button>
            {onDemoClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDemoClick();
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-200 transition flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-slate-700" />
                <span>Try Demo Dataset</span>
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function UploadModal({ isOpen, onClose, onUploaded }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Dataset</h3>
        <p className="text-xs text-slate-500 mb-6">
          Upload any CSV to automatically profile data health, statistics, and anomalies.
        </p>

        <UploadDropzone onUploaded={onUploaded} />
      </div>
    </div>
  );
}
