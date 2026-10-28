# DataDoctor — Intelligent Dataset Analysis & Quality Management System

> **“Diagnose your data. Fix what matters.”**  
> *A comprehensive, college-level Python Mini-Project for automated dataset profiling, data quality scoring, and interactive cleaning.*

---

## 1. Project Overview

**DataDoctor** is a full-stack dataset analysis and quality management system. Users can upload CSV datasets and immediately receive an in-depth diagnosis of dataset structure, health, statistics, anomalies, and relationships. It is built strictly in **Light Mode** with a clean, medical-inspired visual identity.

### Key Capabilities
- **Automated Health Index (0–100):** Transparent score combining Completeness (35%), Uniqueness (25%), Validity (25%), and Consistency (15%).
- **Interactive Dataset Explorer:** Full-text search across rows, multi-column sorting, and server-side pagination.
- **Cleaning Studio with 16 Operations:** Impute with mean/median/mode, filter IQR outliers, trim/normalize whitespace, rename, retype, and reorder with instant multi-step **Undo** and **Reset to Original**.
- **Descriptive Statistics & Analytics:** Central tendency (mean, median), dispersion (std dev, variance, IQR), shape (skewness, kurtosis), categorical frequencies, and Pearson correlation matrices.
- **Visualization Lab:** 15 responsive statistical charts (Bar, Line, Area, Histogram, Scatter, Bubble, Pie, Donut, Box Plot, Violin Density, Correlation Heatmap, Missingness, Count Plot, Time Series, 3D Scatter).
- **Dataset Comparison:** Side-by-side diffing between two CSV datasets, schema comparisons, and record-level key matching.
- **Automated Insights:** Deterministic detection of data sparsity, distribution skews, collinear features, and candidate keys.
- **ReportLab PDF Reports & CSV Exports:** Downloadable academic PDF audit reports and 7 CSV data export types.
- **Academic Learning & Viva Prep:** Detailed mapping to the Python curriculum and 25 viva voce questions and answers.
- **Optional Desktop Companion:** Standalone Python Tkinter desktop tool with embedded Matplotlib visualizations.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS (Strict Light-Mode theme: `#F7F8FC` background, white surfaces, `#4F46E5` indigo primary)
- **Routing:** React Router v7
- **Icons:** Lucide React
- **Charts:** Recharts (SVG-based reactive charts)
- **HTTP Client:** Asynchronous `fetch` service layer

### Backend
- **Runtime:** Python 3.11+ (Tested and verified on Python 3.14.6)
- **API Framework:** FastAPI + Starlette
- **Server:** Uvicorn
- **Data Science:** Pandas 3.0+ & NumPy 2.5+
- **PDF Compilation:** ReportLab 5.1+
- **Data Validation:** Pydantic v2
- **Testing:** Pytest & HTTPX TestClient

---

## 3. Folder Structure

```
DataDoctor/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entry point & CORS
│   │   ├── api/
│   │   │   └── routes/                 # 8 REST API route modules
│   │   │       ├── datasets.py         # Upload, demo data, metadata, preview
│   │   │       ├── quality.py          # 0-100 quality score & diagnostics
│   │   │       ├── cleaning.py         # 16 cleaning ops, undo, reset, history
│   │   │       ├── analytics.py        # Stats, correlations, groupby, dictionary
│   │   │       ├── visualizations.py   # 15 chart data aggregations
│   │   │       ├── comparison.py       # Dataset-to-dataset diffing
│   │   │       ├── insights.py         # Automated anomaly & pattern detection
│   │   │       └── exports.py          # CSV and PDF downloads
│   │   ├── core/
│   │   │   ├── config.py               # Settings & upload limits
│   │   │   └── errors.py               # Custom HTTP exceptions
│   │   ├── models/
│   │   │   └── schemas.py              # Pydantic request & response models
│   │   ├── services/                   # Business logic & algorithms
│   │   │   ├── dataset_manager.py      # Session management & demo generator
│   │   │   ├── quality_analyzer.py     # Multi-criteria quality scoring
│   │   │   ├── data_cleaner.py         # 16 transformations & undo history
│   │   │   ├── statistics_service.py   # Numerical & categorical analytics
│   │   │   ├── visualization_service.py# Chart point computations
│   │   │   ├── comparison_service.py   # Side-by-side diff engine
│   │   │   ├── insight_engine.py       # Rule-based heuristics
│   │   │   ├── report_generator.py     # ReportLab PDF compiler
│   │   │   └── export_service.py       # CSV product generator
│   │   └── utils/
│   │       ├── dataframe_utils.py      # Type inference & JSON sanitization
│   │       └── validation.py           # File validation & header sanitization
│   ├── tests/
│   │   └── test_datadoctor.py          # 14 comprehensive pytest tests
│   ├── requirements.txt                # Backend dependencies
│   ├── .env.example                    # Environment variable template
│   └── optional_tkinter_app.py         # Standalone desktop companion GUI
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/                 # Sidebar, Header, Layout
│   │   │   ├── ui/                     # MetricCard, Badge, Toast, Modal
│   │   │   ├── upload/                 # Drag-and-drop CSV UploadDropzone
│   │   │   └── tables/                 # Server-paginated DataTable
│   │   ├── pages/                      # 10 full-featured application pages
│   │   │   ├── Overview.jsx            # Dashboard & Empty State
│   │   │   ├── Explorer.jsx            # Tabular viewer & Column inspector
│   │   │   ├── Quality.jsx             # 0-100 Health Score & Diagnostics
│   │   │   ├── CleaningStudio.jsx      # 16 transformations & undo history
│   │   │   ├── Analytics.jsx           # Moments, frequencies & groupby
│   │   │   ├── VisualizationLab.jsx    # 15 interactive charts
│   │   │   ├── Comparison.jsx          # Side-by-side dataset diffing
│   │   │   ├── Insights.jsx            # Prioritized findings & anomalies
│   │   │   ├── Reports.jsx             # PDF download & Data Dictionary
│   │   │   └── AboutConcepts.jsx       # Python syllabus mapping & Viva Q&A
│   │   ├── services/
│   │   │   └── api.js                  # Frontend API client
│   │   ├── index.css                   # Custom light-mode design tokens
│   │   ├── App.jsx                     # Router & global state
│   │   └── main.jsx                    # Vite React entry point
│   ├── package.json                    # Dependencies & scripts
│   ├── vite.config.js                  # Vite configuration
│   └── tailwind.config.js              # Theme palette & layout tokens
│
├── docs/
│   ├── PROJECT_REPORT.md               # Formal college project report
│   ├── API_DOCUMENTATION.md            # Complete REST API reference
│   ├── VIVA_QUESTIONS.md               # 25 Viva Voce examination questions
│   └── ALGORITHMS.md                   # Mathematical formulas & logic
│
└── README.md                           # Master project documentation
```

---

## 4. Installation & Setup

### Prerequisites
- Python 3.11 or later (`python --version`)
- Node.js v18 or later (`node --version`)
- npm (`npm --version`)

### Step 1: Install Backend Dependencies
From the repository root:
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

## 5. How to Run the Application

### 1. Start the FastAPI Backend Server
Open a terminal in the `backend/` directory:
```bash
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```
- API will be accessible at: `http://localhost:8001`
- Interactive Swagger UI documentation at: `http://localhost:8001/docs`
- Health check: `http://localhost:8001/api/health`

### 2. Start the React Frontend Development Server
Open a second terminal in the `frontend/` directory:
```bash
cd frontend
npm run dev
```
- Web Application will be live at: `http://localhost:5173`

### 3. (Optional) Run the Desktop Companion GUI
To launch the Python Tkinter desktop interface:
```bash
python backend/optional_tkinter_app.py
```

---

## 6. How to Run Automated Tests

To run the complete test suite covering all endpoints, algorithms, and data cleaning operations:
```bash
python -m pytest backend/tests
```
**Test Results:** 14 passed in 9.58 seconds.

To test the frontend build:
```bash
cd frontend
npm run build
```
**Build Results:** Vite build completes with 0 errors.

---

## 7. How to Use DataDoctor

1. **Open the App:** Navigate to `http://localhost:5173`.
2. **Load Data:** Click **"Try Demo Dataset"** in the top header or upload any CSV file using the drag-and-drop zone.
3. **Inspect Quality:** Navigate to **Data Quality** in the sidebar to review the 0–100 Health Score and point deduction breakdown.
4. **Clean Data:** Navigate to **Cleaning Studio** to remove duplicate rows, fill missing values with mean/median/mode, or filter outliers. Use the **Undo** button to revert any step.
5. **Explore Analytics & Visualizations:** Check **Analytics** for numerical moments and Pearson correlation, or use **Visualization Lab** to generate 15 chart types.
6. **Compare Datasets:** Open **Dataset Comparison** and upload a second CSV to view side-by-side schema and value differences.
7. **Download Reports:** Go to **Reports & Exports** and click **"Download Audit PDF"** to generate an academic report compiled via ReportLab.
8. **Prepare for Viva:** Open **About & Python Viva** to review curriculum concept mappings and 25 viva questions.

---

## 8. Python Syllabus Mapping

| Python Concept | Real Application in DataDoctor | File Reference |
| :--- | :--- | :--- |
| **Variables & Types** | Pydantic type annotations, Pandas dtypes, casting | `backend/app/models/schemas.py` |
| **Control Flow & Loops** | Quality scoring iterations, column diagnostics, outliers | `backend/app/services/quality_analyzer.py` |
| **Functions & Modules** | Modular service classes, pure conversion functions | `backend/app/utils/dataframe_utils.py` |
| **Data Structures** | Sets for schema diffing, tuples for undo history, dicts | `backend/app/services/comparison_service.py` |
| **List Comprehensions** | Sanitizing column names, record transformation | `backend/app/services/statistics_service.py` |
| **Exception Handling** | Custom HTTP exceptions for uploads and illegal ops | `backend/app/core/errors.py` |
| **OOP & Classes** | Session encapsulation (`DatasetSession`, `DatasetManager`)| `backend/app/services/dataset_manager.py` |
| **NumPy Arrays** | `np.histogram`, `np.quantile`, percentiles, variance | `backend/app/services/visualization_service.py` |
| **Pandas DataFrames** | Deep copying, grouping, filtering, correlation | `backend/app/services/data_cleaner.py` |
| **File Handling & Streams**| `io.BytesIO`, `io.StringIO`, multipart file uploads | `backend/app/services/report_generator.py` |

---

## 9. Academic Project Declaration
This project is developed as an academic mini-project for the **Python Programming Laboratory** curriculum. All data profiling algorithms, scoring heuristics, and transformations execute offline using Python and standard libraries without external cloud dependencies.
