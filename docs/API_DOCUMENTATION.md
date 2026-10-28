# DataDoctor — REST API Reference & Specification

Base URL: `http://localhost:8001/api`

---

## 1. System Health
### `GET /health`
Returns system status, service name, and execution engine details.
**Response:**
```json
{
  "status": "healthy",
  "service": "DataDoctor API",
  "version": "1.0.0",
  "engine": "Python / FastAPI / Pandas / NumPy"
}
```

---

## 2. Dataset Management
### `POST /datasets/upload`
Uploads a CSV file using `multipart/form-data`.
**Response:** `DatasetMetadata` object.

### `POST /datasets/demo`
Generates a deterministic synthetic 550+ row Retail Sales dataset with realistic anomalies.
**Response:** `DatasetMetadata` object.

### `GET /datasets/{dataset_id}/metadata`
Returns dimensions, row/column counts, memory usage, duplicate counts, and column profiles.

### `POST /datasets/{dataset_id}/preview`
Returns server-paginated, searched, sorted, and filtered rows.
**Request Body:**
```json
{
  "page": 1,
  "page_size": 25,
  "sort_by": "Total_Revenue",
  "sort_descending": true,
  "search": "Electronics",
  "columns": ["Transaction_ID", "Region", "Total_Revenue"]
}
```

---

## 3. Data Quality Inspector
### `GET /datasets/{dataset_id}/quality`
Runs 12 quality checks and returns the 0–100 health score with component breakdown.
**Response:**
```json
{
  "dataset_id": "demo_retail_500",
  "overall_score": 88.5,
  "severity_label": "Good",
  "components": {
    "completeness": 94.2,
    "uniqueness": 92.5,
    "validity": 85.0,
    "consistency": 90.0
  },
  "deductions": [...],
  "issues": [...]
}
```

---

## 4. Cleaning Studio
### `POST /datasets/{dataset_id}/clean`
Executes an atomic transformation on the working DataFrame.
**Request Body Examples:**
```json
// Impute missing values with mean
{ "operation": "fill_missing_mean", "column": "Satisfaction_Rating" }

// Remove IQR Outliers
{ "operation": "remove_outliers_iqr", "column": "Total_Revenue", "iqr_multiplier": 1.5 }

// Rename Column
{ "operation": "rename_column", "column": "Customer_Tier", "new_name": "Membership_Level" }
```

### `POST /datasets/{dataset_id}/undo`
Reverts the most recent transformation.

### `POST /datasets/{dataset_id}/reset`
Restores dataset to the original uploaded CSV state.

### `GET /datasets/{dataset_id}/history`
Returns chronological audit log of executed operations.

---

## 5. Analytics & Statistics
### `GET /datasets/{dataset_id}/statistics`
Returns numerical moments, categorical frequency distributions, and date ranges.

### `GET /datasets/{dataset_id}/correlation`
Returns Pearson bivariate correlation matrix and significant collinear feature pairs.

### `POST /datasets/{dataset_id}/groupby`
Performs group-by aggregation:
```json
{
  "group_column": "Region",
  "agg_column": "Total_Revenue",
  "agg_function": "mean"
}
```

### `GET /datasets/{dataset_id}/dictionary`
Returns dynamic rule-based data dictionary.

---

## 6. Visualization Lab
### `POST /datasets/{dataset_id}/visualizations/data`
Aggregates live dataset data for chart rendering across 15 chart types.
```json
{
  "chart_type": "bar",
  "x_column": "Region",
  "y_column": "Total_Revenue",
  "aggregation": "mean"
}
```

---

## 7. Dataset Comparison
### `POST /datasets/{dataset_id}/compare`
Compares active dataset against a second dataset ID.
```json
{
  "compare_dataset_id": "target_id_123",
  "key_column": "Transaction_ID"
}
```

---

## 8. Reports & Exports
### `GET /datasets/{dataset_id}/export/csv?type={cleaned|statistics|quality_issues|outliers|history|dictionary}`
Downloads CSV file attachment.

### `GET /datasets/{dataset_id}/export/report`
Generates and downloads a multi-page PDF audit report with ReportLab.
