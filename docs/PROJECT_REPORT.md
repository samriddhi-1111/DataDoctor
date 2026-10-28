# Academic Project Report — DataDoctor
## Intelligent Dataset Analysis & Quality Management System

**Course:** Python Programming Laboratory Mini-Project  
**Author:** Samriddhi  
**Institution:** Chandigarh University  
**Technology Stack:** Python 3.14, FastAPI, Pandas, NumPy, ReportLab, React, Vite, Tailwind CSS  

---

## 1. Abstract
DataDoctor is a dataset analysis and quality management system engineered to automate the initial phases of the data science lifecycle. In data analytics and machine learning, real-world data is frequently contaminated by missing observations, duplicate tuples, statistical outliers, and inconsistent categorical labels. DataDoctor provides an automated pipeline that profiles dataset structure, computes an algorithmic 0–100 Data Quality Health Score, generates descriptive statistics, highlights statistical anomalies, provides a non-destructive 16-operation cleaning studio with multi-step undo, and exports downloadable academic PDF audit reports.

---

## 2. Problem Statement
Data preparation and exploratory data analysis (EDA) often consume up to 80% of a data practitioner's time. Existing spreadsheet tools either fail on large datasets or require manual formula construction. Commercial software platforms require expensive cloud subscriptions and proprietary APIs. There exists a distinct need for a lightweight, transparent, offline-capable Python platform suitable for automated dataset diagnosis, interactive exploration, and reproducible data cleansing.

---

## 3. Project Objectives
1. Implement real-time CSV file ingestion with encoding auto-detection and validation.
2. Build an algorithmic Data Quality Health Scorer (0–100) combining Completeness, Uniqueness, Validity, and Consistency.
3. Provide an interactive Dataset Explorer with server-side pagination, full-text search, and multi-column sorting.
4. Develop a non-destructive Cleaning Studio featuring 16 transformation operations, before/after impact comparison, and LIFO undo stacks.
5. Engineer descriptive statistical calculations (central tendency, dispersion, IQR, skewness, Pearson correlation).
6. Provide an interactive Visualization Lab supporting 15 distinct chart types.
7. Implement side-by-side Dataset Comparison with schema and record-level diffing.
8. Generate downloadable academic PDF audit reports via ReportLab.
9. Deliver an optional companion desktop GUI utilizing Python Tkinter.

---

## 4. System Architecture
The application employs a decoupled client-server architecture:
- **Presentation Layer (Frontend):** React 18, Vite build system, Tailwind CSS for strict light-mode styling, and Recharts for SVG rendering.
- **Service & Gateway Layer (Backend):** Python 3.14 with FastAPI and Uvicorn, enforcing strict Pydantic schemas.
- **Analytical & Computational Engine:** Pandas and NumPy for vectorised calculations and Tukey outlier boundaries.
- **Document Generation Engine:** ReportLab for compiling styled multi-page PDF audit reports.

---

## 5. Implementation Modules
- **Module A — Overview Dashboard:** Health indicators, missingness graphs, memory usage, and recent activity.
- **Module B — Dataset Explorer:** Server-paginated tabular view and column inspector.
- **Module C — Data Quality Inspector:** 12 diagnostic checks and weighted score calculation.
- **Module D — Cleaning Studio:** 16 non-destructive data cleaning operations.
- **Module E — Analytics & Statistics:** Numerical moments, categorical distributions, and groupby aggregation.
- **Module F — Visualization Lab:** 15 statistical charts with user parameter selection.
- **Module G — Dataset Comparison:** Delta metrics, schema diffing, and key-based record tracking.
- **Module H — Automated Insights:** Deterministic anomaly and pattern discovery engine.
- **Module I & J — Reports & Data Dictionary:** PDF audit compilation and rule-based data dictionary.
- **Module K — Python Viva Concepts:** Academic syllabus mapping and viva questions.

---

## 6. Testing & Validation
The test suite in `backend/tests/test_datadoctor.py` was executed with pytest. All 14 test cases passed cleanly, verifying:
- Endpoint health and CORS headers.
- Synthetic demo dataset generation (550+ rows).
- CSV upload, parsing, and invalid file rejection.
- Data Quality Score bounds ($0 \le \text{Score} \le 100$).
- Cleaning operations (duplicate removal, mean imputation, column renaming).
- Undo and reset behavior.
- Numerical moments and Pearson correlation.
- Dataset comparison logic.
- PDF generation and CSV export streams.

---

## 7. Conclusion & Future Scope
DataDoctor successfully delivers an end-to-end dataset analysis and quality management system. Future enhancements may include integration with SQLite/PostgreSQL for persistent dataset sessions, distributed processing via Polars or PySpark for multi-gigabyte files, and automated feature selection for machine learning workflows.
