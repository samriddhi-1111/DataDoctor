import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Columns,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { api } from "../../services/api";

export function DataTable({ datasetId, totalRows }) {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [columnTypes, setColumnTypes] = useState({});
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [sortBy, setSortBy] = useState(null);
  const [sortDesc, setSortDesc] = useState(false);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showColPicker, setShowColPicker] = useState(false);

  // Filters
  const [filterCol, setFilterCol] = useState("");
  const [filterOp, setFilterOp] = useState("contains");
  const [filterVal, setFilterVal] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);

  const loadData = async () => {
    if (!datasetId) return;
    setIsLoading(true);
    try {
      const res = await api.getPreview(datasetId, {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_descending: sortDesc,
        search: search.trim() || null,
        columns: selectedColumns.length > 0 ? selectedColumns : null,
        filters: activeFilters.length > 0 ? activeFilters : null,
      });

      setData(res.data || []);
      setColumns(res.columns || []);
      setColumnTypes(res.column_types || {});
      setTotalPages(res.total_pages || 1);
      setTotalFiltered(res.total_filtered_rows || 0);
    } catch (err) {
      console.error("Failed to load table data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [datasetId, page, pageSize, sortBy, sortDesc, activeFilters]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSort = (col) => {
    if (sortBy === col) {
      if (sortDesc) {
        setSortBy(null);
        setSortDesc(false);
      } else {
        setSortDesc(true);
      }
    } else {
      setSortBy(col);
      setSortDesc(false);
    }
  };

  const addFilter = () => {
    if (!filterCol) return;
    setActiveFilters((prev) => [
      ...prev,
      { column: filterCol, operator: filterOp, value: filterVal },
    ]);
    setFilterVal("");
    setPage(1);
  };

  const removeFilter = (index) => {
    setActiveFilters((prev) => prev.filter((_, i) => i !== index));
    setPage(1);
  };

  return (
    <div className="card-shine bg-white rounded-2xl border border-[#E7EAF2] overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-[#E7EAF2] flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC]/50">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search across rows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-[#E7EAF2] rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowColPicker(!showColPicker)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-[#E7EAF2] hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Columns</span>
            </button>

            {showColPicker && (
              <div className="absolute left-0 mt-2 z-20 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-3 max-h-64 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Columns
                </div>
                {columns.map((c) => (
                  <label
                    key={c}
                    className="flex items-center gap-2 py-1 text-xs text-slate-700 hover:text-indigo-600 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedColumns.length === 0 || selectedColumns.includes(c)
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedColumns.length > 0) {
                            setSelectedColumns([...selectedColumns, c]);
                          }
                        } else {
                          const newCols =
                            selectedColumns.length === 0
                              ? columns.filter((col) => col !== c)
                              : selectedColumns.filter((col) => col !== c);
                          setSelectedColumns(newCols);
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="truncate">{c}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rows Counter */}
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{data.length}</span> of{" "}
          <span className="font-bold text-slate-800">{totalFiltered.toLocaleString()}</span> filtered rows
        </div>
      </div>

      {/* Filter Row */}
      <div className="px-4 py-2 border-b border-[#E7EAF2] bg-white flex flex-wrap items-center gap-2 text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-600">Quick Filter:</span>
        <select
          value={filterCol}
          onChange={(e) => setFilterCol(e.target.value)}
          className="bg-[#F8FAFC] border border-[#E7EAF2] rounded-lg px-2 py-1 text-xs font-medium text-slate-700"
        >
          <option value="">Select Column</option>
          {columns.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={filterOp}
          onChange={(e) => setFilterOp(e.target.value)}
          className="bg-[#F8FAFC] border border-[#E7EAF2] rounded-lg px-2 py-1 text-xs font-medium text-slate-700"
        >
          <option value="contains">contains</option>
          <option value="equals">equals</option>
          <option value="not_equals">not equals</option>
          <option value="greater_than">&gt; greater than</option>
          <option value="less_than">&lt; less than</option>
          <option value="is_null">is missing (null)</option>
          <option value="not_null">is not null</option>
        </select>

        {filterOp !== "is_null" && filterOp !== "not_null" && (
          <input
            type="text"
            placeholder="Value..."
            value={filterVal}
            onChange={(e) => setFilterVal(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E7EAF2] rounded-lg px-2.5 py-1 text-xs text-slate-700 w-32"
          />
        )}

        <button
          onClick={addFilter}
          disabled={!filterCol}
          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 disabled:opacity-50 transition"
        >
          Apply Filter
        </button>

        {activeFilters.map((f, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium"
          >
            <span>
              {f.column} {f.operator} {f.value}
            </span>
            <button
              onClick={() => removeFilter(i)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto flex-1 relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs z-10 flex items-center justify-center">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-xl shadow-md border border-slate-200 text-xs font-semibold text-indigo-600">
              <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading dataset rows...</span>
            </div>
          </div>
        )}

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E7EAF2] bg-[#F8FAFC]">
              <th className="py-2.5 px-3 font-semibold text-slate-500 w-12 text-center">#</th>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="py-2.5 px-3 font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col}</span>
                    {columnTypes[col] && (
                      <Badge type={columnTypes[col]} size="sm" />
                    )}
                    <span className="text-slate-400">
                      {sortBy === col ? (
                        sortDesc ? (
                          <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7EAF2]">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="py-12 text-center text-slate-400 text-xs font-medium"
                >
                  No matching records found for this query or filter.
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-indigo-50/30 transition-colors"
                >
                  <td className="py-2.5 px-3 text-slate-400 text-center font-mono text-[11px]">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col];
                    const isNull = val === null || val === undefined;
                    return (
                      <td
                        key={col}
                        className={`py-2.5 px-3 whitespace-nowrap ${
                          isNull ? "text-slate-300 italic font-mono" : "text-slate-700 font-medium"
                        }`}
                      >
                        {isNull ? "null" : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-[#E7EAF2] flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC]/50 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-white border border-[#E7EAF2] rounded-lg px-2 py-1 text-xs font-semibold text-slate-700"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">
            Page <span className="font-bold text-slate-800">{page}</span> of{" "}
            <span className="font-bold text-slate-800">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-[#E7EAF2] bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[#E7EAF2] bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
