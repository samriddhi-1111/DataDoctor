# DataDoctor — Academic Viva Voce Questions & Answers
## 25 Technical & Theoretical Assessment Questions

### Category A: Core Architecture & Python Fundamentals

#### Q1. What is the fundamental objective of the DataDoctor mini-project?
**Answer:** DataDoctor is an automated dataset diagnostic and quality management platform. It ingests CSV datasets, algorithmically computes a 0–100 Data Quality Health Score across four dimensions (Completeness, Uniqueness, Validity, Consistency), profiles statistical moments, detects anomalies, provides 16 non-destructive cleaning transformations with undo, and exports academic PDF audit reports.

#### Q2. Why was FastAPI chosen instead of Flask or Django?
**Answer:** FastAPI was selected because of its high execution performance (Starlette/Uvicorn), native asynchronous concurrency support, built-in Pydantic request/response schema validation, and automatic OpenAPI interactive documentation (`/docs`).

#### Q3. How does the backend communicate with the frontend?
**Answer:** Through a decoupled RESTful JSON API. The React frontend dispatches asynchronous `fetch` requests to endpoints mounted under `/api/datasets/...`, receiving typed JSON responses or raw binary streams for PDF/CSV downloads.

#### Q4. What is the role of Pydantic in this application?
**Answer:** Pydantic enforces strict type safety and request validation on incoming parameters (e.g., column names, operation types, pagination page numbers) and serializes backend Python objects into valid JSON responses.

#### Q5. How are custom exceptions handled in DataDoctor?
**Answer:** Custom exception classes extending `HTTPException` (such as `DatasetNotFoundError`, `InvalidOperationError`, and `FileValidationError`) intercept runtime errors and return clean HTTP status codes (404, 400, 422) with actionable error descriptions, hiding internal server stack traces.

---

### Category B: Pandas, NumPy & Data Science Logic

#### Q6. How does DataDoctor distinguish between categorical and text data types?
**Answer:** The `infer_column_type` utility inspects the cardinality ratio: $\frac{\text{unique\_count}}{\text{total\_count}}$. If the ratio is below 0.25 or total unique values $\le 20$, it is classified as `categorical`; otherwise, high-cardinality free-form strings are classified as `text`.

#### Q7. How does DataDoctor handle missing values during statistics calculations?
**Answer:** Pandas `.dropna()` and `.notna()` are used selectively so missing entries do not contaminate calculations like mean, variance, or quantiles.

#### Q8. What is the difference between Mean, Median, and Mode in data cleaning?
**Answer:** Mean is sensitive to extreme outliers; Median is the 50th percentile and robust against skewness; Mode is the most frequent discrete value, ideal for categorical class imputation.

#### Q9. How does the 1.5x IQR outlier detection work?
**Answer:** It implements Tukey's rule: $IQR = Q_3 - Q_1$. Lower fence $= Q_1 - 1.5 \times IQR$ and Upper fence $= Q_3 + 1.5 \times IQR$. Any value beyond these fences is flagged as an outlier.

#### Q10. What is Pearson's correlation coefficient and what do its signs mean?
**Answer:** It measures linear bivariate correlation between two continuous variables. $+1$ indicates perfect positive collinearity, $-1$ indicates perfect inverse collinearity, and $0$ indicates absence of linear association.

#### Q11. How is skewness defined and interpreted?
**Answer:** Skewness measures distribution asymmetry. Positive skew indicates a long tail to the right (higher values), while negative skew indicates a tail to the left.

#### Q12. How does DataDoctor prevent browser freeze on large datasets?
**Answer:** It applies server-side pagination with `df.iloc[start:end]` and limit restrictions, sending only 25–100 rows per request rather than megabytes of raw table data.

---

### Category C: Cleaning Studio & Data Integrity

#### Q13. How does DataDoctor support Undo without a database?
**Answer:** The `DatasetSession` maintains a LIFO history stack of `(df_before, history_entry)` tuples. An undo pops the last saved DataFrame copy and invalidates stale caches.

#### Q14. What happens when a user clicks 'Reset to Original'?
**Answer:** The working DataFrame is re-instantiated from a deep copy of the original uploaded DataFrame (`self.original_df.copy()`), and the history stack is emptied.

#### Q15. Does DataDoctor mutate the user's original file?
**Answer:** No. Transformations are applied solely in server memory to the session's `working_df`. The original file remains untouched.

#### Q16. Why is arbitrary user string evaluation (`eval()`) forbidden?
**Answer:** `eval()` allows Remote Code Execution (RCE) vulnerabilities. DataDoctor validates operations through strict enumeration and type-checked parameters.

#### Q17. How does DataDoctor handle JSON serialization of float NaN and Infinity?
**Answer:** Standard JSON does not support `NaN` or `Infinity`. The `sanitize_value_for_json` utility converts NaNs to `None` (JSON `null`) and infinities to formatted strings.

---

### Category D: Quality Scoring & Diagnostics

#### Q18. How is the 0–100 Data Quality Score calculated?
**Answer:** As a weighted sum: 35% Completeness + 25% Uniqueness + 25% Validity + 15% Consistency.

#### Q19. What factors cause deductions in the Consistency score?
**Answer:** Columns with constant values (zero variance) and category casing discrepancies (e.g. "Male" vs "male" in the same column).

#### Q20. Can an empty dataset receive a passing score?
**Answer:** No. Empty datasets trigger a 100-point deduction and are flagged as critical failures with a score of 0.0.

---

### Category E: PDF Generation & Visualizations

#### Q21. How are PDF reports generated?
**Answer:** Using ReportLab's `SimpleDocTemplate`, `Paragraph`, and `Table` flowables directly in an in-memory `io.BytesIO` buffer, avoiding temporary disk file creation.

#### Q22. How are charts rendered in the frontend?
**Answer:** Using Recharts with dynamic SVG primitives. The backend supplies aggregated data points (`x`, `y`, `count`, `density`, quartiles).

#### Q23. What chart types does the Visualization Lab support?
**Answer:** 15 distinct types: Bar, Line, Area, Histogram, Scatter, Bubble, Pie, Donut, Box Plot, Violin Density, Correlation Heatmap, Missingness Bar, Count Plot, Time Series, and 3D Scatter.

#### Q24. How does Dataset Comparison work?
**Answer:** It compares two datasets on dimension deltas, schema additions/deletions, missing rate changes, duplicate changes, summary statistic deltas, and record-level key alignments.

#### Q25. What is the Tkinter companion app?
**Answer:** An optional standalone desktop interface demonstrating Tkinter GUI controls, event binding, and Matplotlib canvas embedding using the exact same Python analytics services.
