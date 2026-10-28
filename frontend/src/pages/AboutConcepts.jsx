import React from "react";
import {
  GraduationCap,
  Code2,
  Cpu,
  Layers,
  HelpCircle,
  FileCode,
  Network,
  CheckCircle2,
  Terminal,
} from "lucide-react";

export function AboutConcepts() {
  const pythonConcepts = [
    {
      title: "1. Variables & Data Types",
      usage: "Pydantic Schemas & Data Types",
      desc: "Used throughout backend models (`schemas.py`), where Pydantic models enforce strict data types (int, float, str, bool, List, Dict). In Pandas, series dtypes are cast between Int64, Float64, datetime64, and category.",
      code: `class ColumnMeta(BaseModel):\n    name: str\n    dtype: str\n    null_count: int\n    null_percentage: float\n    sample_values: List[Any]`,
    },
    {
      title: "2. Conditional Statements & Loops",
      usage: "Quality Scoring & Heuristics",
      desc: "Used in `quality_analyzer.py` to iterate through all dataset columns, inspect missing rates, compute bounds for statistical deductions, and grade the overall dataset from 0 to 100.",
      code: `for col in df.columns:\n    null_cnt = int(df[col].isna().sum())\n    if null_cnt > 0:\n        pct = (null_cnt / total_rows) * 100\n        issues.append(QualityIssue(column=col, affected_percentage=pct))`,
    },
    {
      title: "3. Functions & Return Values",
      usage: "Modular Service Layer",
      desc: "Implemented across `dataframe_utils.py` and service classes where pure functions accept DataFrames and arguments and return structured, sanitized responses.",
      code: `def format_memory_size(bytes_size: int) -> str:\n    if bytes_size < 1024 * 1024:\n        return f"{bytes_size / 1024:.1f} KB"\n    return f"{bytes_size / (1024 * 1024):.2f} MB"`,
    },
    {
      title: "4. Lists, Tuples, Sets & Dictionaries",
      usage: "Diffing, History Stacks & Maps",
      desc: "Sets are used in `comparison_service.py` (`cols1.intersection(cols2)`) for schema diffing; Tuples are used in `history_stack` for immutable (DataFrame, Operation) history states; Dictionaries are used for JSON payloads and category replacement maps.",
      code: `common_cols = sorted(list(set(df1.columns).intersection(set(df2.columns))))\nadded_cols = sorted(list(set(df2.columns) - set(df1.columns)))\nself.history_stack.append((df_before.copy(), entry))`,
    },
    {
      title: "5. List & Dict Comprehensions",
      usage: "Data Transformation & Extraction",
      desc: "Employed for fast transformations, such as cleaning column headers, extracting non-null sample tokens, and sanitizing row records for JSON serialization.",
      code: `clean_cols = [str(c).strip() for c in df.columns]\nsamples = [sanitize_val(v) for v in s.dropna().head(5).tolist()]`,
    },
    {
      title: "6. Exception Handling & Custom Errors",
      usage: "Robust API Guardrails",
      desc: "Custom HTTP exceptions (`DatasetNotFoundError`, `InvalidOperationError`, `FileValidationError`) intercept malformed user requests, empty CSV files, or illegal operations with clear error messages.",
      code: `try:\n    df = pd.read_csv(stream, encoding=enc)\nexcept Exception as e:\n    raise FileValidationError(f"Could not parse CSV: {str(e)}")`,
    },
    {
      title: "7. Classes & Object-Oriented Programming (OOP)",
      usage: "Session State & Service Abstractions",
      desc: "Encapsulation is demonstrated in `DatasetSession` which encapsulates original_df, working_df, history_stack, and cache invalidation. Singleton pattern is used in `DatasetManager`.",
      code: `class DatasetSession:\n    def __init__(self, dataset_id: str, name: str, original_df: pd.DataFrame):\n        self.original_df = original_df.copy()\n        self.working_df = original_df.copy()\n        self.history_stack = []`,
    },
    {
      title: "8. NumPy Numerical Calculations",
      usage: "Quantiles, Bins & Statistical Arrays",
      desc: "Employed in `quality_analyzer.py` and `visualization_service.py` to calculate histograms (`np.histogram`), percentiles (`np.quantile`), interquartile ranges, and variance.",
      code: `counts, bin_edges = np.histogram(num_series, bins=n_bins)\nq25 = float(series.quantile(0.25))\nq75 = float(series.quantile(0.75))\niqr = q75 - q25`,
    },
    {
      title: "9. Pandas DataFrames & Series",
      usage: "Core Tabular Engine",
      desc: "The backbone of DataDoctor. Used for grouping, pivot calculations, correlation matrices (`df.corr()`), duplicate detection (`df.duplicated()`), sorting, and slicing.",
      code: `grouped = df.groupby(group_col)[agg_col].agg(fn).reset_index()\ncorr_matrix = numeric_df.corr(method="pearson").round(3)`,
    },
    {
      title: "10. In-Memory Streams & PDF Generation",
      usage: "ReportLab & io.BytesIO",
      desc: "Used in `report_generator.py` and `export_service.py` to generate in-memory PDFs and CSVs using `io.BytesIO` and `io.StringIO` without writing redundant temp files to disk.",
      code: `buffer = io.BytesIO()\ndoc = SimpleDocTemplate(buffer, pagesize=letter)\ndoc.build(story)\nreturn buffer.getvalue()`,
    },
  ];

  const vivaQuestions = [
    {
      q: "1. What is the architecture of DataDoctor?",
      a: "DataDoctor follows a decoupled client-server architecture: React (Vite, Tailwind CSS, Recharts) on the frontend communicating via asynchronous REST API calls with a FastAPI backend powered by Pandas, NumPy, and ReportLab for data science computations.",
    },
    {
      q: "2. How does DataDoctor calculate the Data Quality Score?",
      a: "It uses a transparent, weighted 0–100 composite index combining Completeness (35%, based on missing-cell rate), Uniqueness (25%, based on duplicate-row rate), Validity (25%, based on 1.5x IQR statistical outlier rates), and Consistency (15%, based on constant columns and casing variances).",
    },
    {
      q: "3. How is the Undo operation implemented without a database?",
      a: "The DatasetSession class maintains an in-memory history stack of immutable (DataFrame, Operation) tuples. When an undo request arrives, the working DataFrame is restored to the previous copy, the operation log is updated, and all analytical caches are invalidated.",
    },
    {
      q: "4. Why is Copy-on-Write (CoW) important in Pandas?",
      a: "Copy-on-Write guarantees that slicing or filtering a DataFrame does not unintentionally mutate the parent or underlying memory array unless explicitly reassigned, preventing silent side-effects during multi-step cleaning.",
    },
    {
      q: "5. How does the outlier detection algorithm work?",
      a: "It implements John Tukey's standard Interquartile Range (IQR) rule: IQR = Q3 - Q1. Any numerical observation strictly below (Q1 - 1.5 * IQR) or strictly above (Q3 + 1.5 * IQR) is flagged as a statistical anomaly.",
    },
    {
      q: "6. How is Pearson correlation computed?",
      a: "Pearson's correlation coefficient r measures linear bivariate dependence between two continuous variables as the covariance divided by the product of their standard deviations. Values range from -1.0 to +1.0.",
    },
    {
      q: "7. How are large datasets handled without crashing the browser?",
      a: "The backend uses server-side pagination with limit and offset slicing (`df.iloc[start:end]`). Only the requested page (e.g. 25 rows) is serialized to JSON and sent over the network.",
    },
    {
      q: "8. How does DataDoctor handle NaN and Infinity in JSON serialization?",
      a: "Native JSON cannot parse Python's float('nan') or float('inf'). DataDoctor uses a custom recursive sanitizer (`sanitize_value_for_json`) that transforms NaNs to null and infinities to strings ('Infinity' / '-Infinity').",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <GraduationCap className="w-6 h-6 text-indigo-600" />
          <span>Academic Overview & Python Syllabus Concepts</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Comprehensive mapping of Python programming concepts utilized throughout the DataDoctor implementation, along with viva examination preparation.
        </p>
      </div>

      {/* System Architecture Diagram Card */}
      <div className="card-shine p-6 rounded-3xl bg-white border border-[#E7EAF2]">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Network className="w-4 h-4 text-indigo-600" />
          <span>Application Architectural Flow</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-indigo-600 uppercase">Frontend Client</span>
            <div className="font-extrabold text-slate-900 text-sm my-2">React + Vite</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Tailwind CSS, Recharts, Lucide Icons, REST client
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">API Gateway</span>
            <div className="font-extrabold text-slate-900 text-sm my-2">FastAPI + Uvicorn</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Pydantic validation, CORS middleware, multipart uploads
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-indigo-600 uppercase">Analytical Engine</span>
            <div className="font-extrabold text-slate-900 text-sm my-2">Pandas & NumPy</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Cleaning Studio, Quality Scorer, Stats, Insight Engine
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Output Products</span>
            <div className="font-extrabold text-slate-900 text-sm my-2">PDF & CSV Exports</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              ReportLab PDF generator, CSV tables, Data Dictionary
            </p>
          </div>
        </div>
      </div>

      {/* Python Syllabus Concepts Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-600" />
          <span>Core Python Concepts Implemented in Source Code</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pythonConcepts.map((item, idx) => (
            <div
              key={idx}
              className="card-shine p-5 rounded-2xl bg-white border border-[#E7EAF2] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {item.usage}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {item.desc}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 text-indigo-300 font-mono text-[11px] overflow-x-auto">
                <pre>{item.code}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Viva Voce Questions Section */}
      <div className="card-shine p-6 rounded-3xl bg-white border border-[#E7EAF2] space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E7EAF2]">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Viva Voce Examination Questions & Answers
            </h3>
            <p className="text-xs text-slate-500">
              Key theoretical and architectural questions frequently asked in college viva assessments.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vivaQuestions.map((v, i) => (
            <div key={i} className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E7EAF2] space-y-1.5">
              <h4 className="font-bold text-xs text-slate-900">{v.q}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{v.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
