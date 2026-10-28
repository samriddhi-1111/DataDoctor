import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  Sparkles,
  Undo2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  Trash2,
  Edit3,
  SlidersHorizontal,
  Layers,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { ConfirmationModal } from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";
import { api } from "../services/api";

export function CleaningStudio() {
  const { datasetId, metadata, refreshDataset } = useOutletContext();
  const { showToast } = useToast();

  const [operation, setOperation] = useState("remove_duplicates");
  const [selectedColumn, setSelectedColumn] = useState("");
  const [columnsToDrop, setColumnsToDrop] = useState([]);
  const [customValue, setCustomValue] = useState("");
  const [newName, setNewName] = useState("");
  const [targetType, setTargetType] = useState("float");
  const [replaceMapFrom, setReplaceMapFrom] = useState("");
  const [replaceMapTo, setReplaceMapTo] = useState("");
  const [iqrMultiplier, setIqrMultiplier] = useState(1.5);
  
  // Filter condition state
  const [filterOp, setFilterOp] = useState("equals");
  const [filterVal, setFilterVal] = useState("");

  // History & Metrics
  const [history, setHistory] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", action: null });

  const loadHistory = async () => {
    if (!datasetId) return;
    try {
      const hist = await api.getCleaningHistory(datasetId);
      setHistory(hist || []);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  useEffect(() => {
    loadHistory();
    if (metadata?.columns?.length > 0 && !selectedColumn) {
      setSelectedColumn(metadata.columns[0].name);
    }
  }, [datasetId, metadata]);

  if (!datasetId || !metadata) {
    return (
      <div className="card-shine rounded-3xl p-8 bg-white border border-[#E7EAF2] text-center max-w-xl mx-auto my-12">
        <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Dataset Active</h3>
        <p className="text-xs text-slate-500 mb-4">
          Please upload or load a dataset to use Cleaning Studio.
        </p>
        <Link to="/" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
          Go to Overview
        </Link>
      </div>
    );
  }

  const executeOperation = async () => {
    setIsLoading(true);
    try {
      const payload = {
        operation,
        column: selectedColumn || null,
        columns: operation === "drop_columns" ? columnsToDrop : null,
        custom_value: operation === "fill_missing_custom" ? customValue : null,
        new_name: operation === "rename_column" ? newName : null,
        target_type: operation === "convert_type" ? targetType : null,
        replace_map: operation === "replace_values" ? { [replaceMapFrom]: replaceMapTo } : null,
        iqr_multiplier: Number(iqrMultiplier),
        filter_condition:
          operation === "filter_rows"
            ? { column: selectedColumn, operator: filterOp, value: filterVal }
            : null,
      };

      const res = await api.applyCleaning(datasetId, payload);
      setLastResult(res);
      showToast(res.message, "success");
      await refreshDataset();
      await loadHistory();
      
      // Reset inputs
      setNewName("");
      setCustomValue("");
      setReplaceMapFrom("");
      setReplaceMapTo("");
      setFilterVal("");
    } catch (err) {
      showToast(err.message || "Cleaning operation failed", "error");
    } finally {
      setIsLoading(false);
      setConfirmModal({ isOpen: false, title: "", message: "", action: null });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if operation is destructive and needs confirmation
    if (operation === "drop_columns") {
      if (columnsToDrop.length === 0) {
        showToast("Please select at least one column to drop", "warning");
        return;
      }
      setConfirmModal({
        isOpen: true,
        title: `Drop ${columnsToDrop.length} Column(s)?`,
        message: `Are you sure you want to permanently drop: ${columnsToDrop.join(", ")}? You can undo this action if needed.`,
        action: executeOperation,
      });
      return;
    }

    if (operation === "drop_rows_with_missing") {
      setConfirmModal({
        isOpen: true,
        title: "Drop Rows with Missing Values?",
        message: `This will drop all rows containing missing values${
          selectedColumn ? ` in column '${selectedColumn}'` : " across all columns"
        }.`,
        action: executeOperation,
      });
      return;
    }

    if (operation === "remove_outliers_iqr") {
      setConfirmModal({
        isOpen: true,
        title: `Remove Outliers in '${selectedColumn}'?`,
        message: `This will remove all rows where '${selectedColumn}' falls outside ${iqrMultiplier}x IQR fences.`,
        action: executeOperation,
      });
      return;
    }

    executeOperation();
  };

  const handleUndo = async () => {
    setIsLoading(true);
    try {
      const res = await api.undoCleaning(datasetId);
      showToast(res.message, "success");
      await refreshDataset();
      await loadHistory();
      setLastResult(null);
    } catch (err) {
      showToast(err.message || "Failed to undo", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setConfirmModal({
      isOpen: true,
      title: "Reset to Original CSV?",
      message: "Are you sure you want to discard all cleaning operations and restore the initial uploaded DataFrame?",
      action: async () => {
        setIsLoading(true);
        try {
          const res = await api.resetCleaning(datasetId);
          showToast(res.message, "success");
          await refreshDataset();
          await loadHistory();
          setLastResult(null);
        } catch (err) {
          showToast(err.message || "Reset failed", "error");
        } finally {
          setIsLoading(false);
          setConfirmModal({ isOpen: false, title: "", message: "", action: null });
        }
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <span>Cleaning Studio</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Apply non-destructive transformations to the working DataFrame with instant live preview and undo support.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={isLoading || history.length === 0}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-[#E7EAF2] hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5 disabled:opacity-40"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo Step</span>
          </button>
          <button
            onClick={handleReset}
            disabled={isLoading || history.length === 0}
            className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition flex items-center gap-1.5 disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Original</span>
          </button>
        </div>
      </div>

      {/* Before / After Impact Comparison Panel */}
      {lastResult && (
        <div className="card-shine p-5 rounded-2xl bg-white border border-indigo-200 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-sm text-slate-900">
                Transformation Successful: {lastResult.operation}
              </span>
            </div>
            <span className="text-xs text-slate-500">{lastResult.message}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-[11px] block">Row Count</span>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-slate-500 line-through">{lastResult.rows_before}</span>
                <span className="text-slate-900 font-bold">{lastResult.rows_after}</span>
                <span className="text-indigo-600 text-[10px]">
                  ({lastResult.rows_after - lastResult.rows_before})
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-[11px] block">Columns</span>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-slate-500 line-through">{lastResult.columns_before}</span>
                <span className="text-slate-900 font-bold">{lastResult.columns_after}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-[11px] block">Missing Cells</span>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-slate-500 line-through">{lastResult.missing_before}</span>
                <span className="text-slate-900 font-bold">{lastResult.missing_after}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-[11px] block">Quality Score</span>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-slate-500 line-through">{lastResult.quality_score_before}</span>
                <span className="text-emerald-600 font-bold">{lastResult.quality_score_after}/100</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operation Form and History Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cleaning Action Form */}
        <div className="card-shine p-6 rounded-2xl bg-white border border-[#E7EAF2] lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Cleaning Operation
              </label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500"
              >
                <optgroup label="Duplicates & Nulls">
                  <option value="remove_duplicates">1. Remove Duplicate Rows</option>
                  <option value="drop_empty_rows">2. Drop Entirely Empty Rows</option>
                  <option value="drop_rows_with_missing">8. Drop Rows with Missing Values</option>
                </optgroup>
                <optgroup label="Missing Value Imputation">
                  <option value="fill_missing_mean">4. Fill Numeric with Mean</option>
                  <option value="fill_missing_median">5. Fill Numeric with Median</option>
                  <option value="fill_missing_mode">6. Fill Categorical with Mode</option>
                  <option value="fill_missing_custom">7. Fill Missing with Custom Value</option>
                </optgroup>
                <optgroup label="Schema & Type Transformations">
                  <option value="drop_columns">3. Drop Selected Column(s)</option>
                  <option value="rename_column">10. Rename Column</option>
                  <option value="convert_type">9. Convert Column Data Type</option>
                </optgroup>
                <optgroup label="Text & Category Normalization">
                  <option value="normalize_whitespace">11. Normalize Internal Whitespace</option>
                  <option value="trim_whitespace">12. Trim Leading & Trailing Whitespace</option>
                  <option value="replace_values">13. Replace Categorical Values (Mapping)</option>
                </optgroup>
                <optgroup label="Filtering & Outliers">
                  <option value="remove_outliers_iqr">15. Remove Numerical Outliers (IQR Method)</option>
                  <option value="filter_rows">14. Filter Rows by Condition</option>
                </optgroup>
              </select>
            </div>

            {/* Dynamic Parameters based on Operation */}
            {/* Target Column Selector (Used by most single-column ops) */}
            {![
              "remove_duplicates",
              "drop_empty_rows",
              "drop_columns",
            ].includes(operation) && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Target Column
                </label>
                <select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs sm:text-sm font-medium text-slate-800"
                >
                  {metadata.columns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.inferred_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Drop Columns Multi-selector */}
            {operation === "drop_columns" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Columns to Drop
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl">
                  {metadata.columns.map((col) => (
                    <label
                      key={col.name}
                      className="flex items-center gap-2 p-1.5 rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={columnsToDrop.includes(col.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setColumnsToDrop([...columnsToDrop, col.name]);
                          } else {
                            setColumnsToDrop(columnsToDrop.filter((c) => c !== col.name));
                          }
                        }}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="truncate">{col.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Value Input */}
            {operation === "fill_missing_custom" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Replacement Value
                </label>
                <input
                  type="text"
                  placeholder="e.g., 0, Unknown, Not Applicable"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs sm:text-sm text-slate-800"
                />
              </div>
            )}

            {/* Rename Input */}
            {operation === "rename_column" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  New Column Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Customer_Membership_Tier"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs sm:text-sm text-slate-800"
                />
              </div>
            )}

            {/* Convert Type Selector */}
            {operation === "convert_type" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Target Data Type
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs sm:text-sm text-slate-800"
                >
                  <option value="int">Integer (Int64)</option>
                  <option value="float">Floating Point (Float64)</option>
                  <option value="str">String / Text</option>
                  <option value="datetime">Datetime</option>
                </select>
              </div>
            )}

            {/* Replace Value Pair */}
            {operation === "replace_values" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Original Value
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., USA"
                    value={replaceMapFrom}
                    onChange={(e) => setReplaceMapFrom(e.target.value)}
                    required
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs sm:text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Replace With
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., United States"
                    value={replaceMapTo}
                    onChange={(e) => setReplaceMapTo(e.target.value)}
                    required
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs sm:text-sm text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* IQR Multiplier */}
            {operation === "remove_outliers_iqr" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  IQR Multiplier Threshold
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={iqrMultiplier}
                    onChange={(e) => setIqrMultiplier(e.target.value)}
                    className="flex-1"
                  />
                  <span className="font-mono font-bold text-sm text-indigo-600 w-12">
                    {iqrMultiplier}x
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  1.5x is standard Tukey outlier rule; 3.0x removes only extreme outliers.
                </p>
              </div>
            )}

            {/* Row Filter Options */}
            {operation === "filter_rows" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Condition
                  </label>
                  <select
                    value={filterOp}
                    onChange={(e) => setFilterOp(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs sm:text-sm text-slate-800"
                  >
                    <option value="equals">equals</option>
                    <option value="not_equals">not equals</option>
                    <option value="greater_than">&gt; greater than</option>
                    <option value="less_than">&lt; less than</option>
                    <option value="contains">contains substring</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Value
                  </label>
                  <input
                    type="text"
                    placeholder="Condition value"
                    value={filterVal}
                    onChange={(e) => setFilterVal(e.target.value)}
                    required
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E7EAF2] rounded-xl text-xs sm:text-sm text-slate-800"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm shadow-indigo-200 transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  <span>Transforming dataset...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Cleaning Transformation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Audit Log / History Sidebar */}
        <div className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Audit Trail ({history.length} steps)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Chronological log of session transformations.
            </p>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No transformations applied yet.
                </div>
              ) : (
                history.map((step) => (
                  <div
                    key={step.step_id}
                    className="p-3 rounded-xl border border-[#E7EAF2] bg-[#F8FAFC] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        #{step.step_id} {step.operation}
                      </span>
                      <span className="text-[10px] text-slate-400">{step.timestamp}</span>
                    </div>
                    {step.column && (
                      <div className="text-[11px] text-slate-500">
                        Target: <span className="font-mono text-slate-700">{step.column}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                      <span>Rows: {step.rows_before} → {step.rows_after}</span>
                      <span>Affected: {step.affected_rows}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E7EAF2] mt-4">
            <Link
              to="/explorer"
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <span>Inspect Working Rows in Explorer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ isOpen: false, title: "", message: "", action: null })}
        isLoading={isLoading}
      />
    </div>
  );
}
