from typing import Any, Optional, Dict, List, Union
from pydantic import BaseModel, Field

class ColumnMeta(BaseModel):
    name: str
    dtype: str
    inferred_type: str  # numeric, categorical, datetime, boolean, text
    null_count: int
    null_percentage: float
    unique_count: int
    sample_values: List[Any]

class DatasetMetadata(BaseModel):
    dataset_id: str
    name: str
    total_rows: int
    total_columns: int
    memory_usage_bytes: int
    memory_usage_formatted: str
    numerical_columns_count: int
    categorical_columns_count: int
    datetime_columns_count: int
    missing_cells_total: int
    missing_cells_percentage: float
    duplicate_rows_count: int
    duplicate_rows_percentage: float
    columns: List[ColumnMeta]
    created_at: str
    updated_at: str

class PreviewRequest(BaseModel):
    page: int = 1
    page_size: int = 25
    sort_by: Optional[str] = None
    sort_descending: bool = False
    search: Optional[str] = None
    columns: Optional[List[str]] = None
    filters: Optional[List[Dict[str, Any]]] = None

class PreviewResponse(BaseModel):
    dataset_id: str
    page: int
    page_size: int
    total_rows: int
    total_filtered_rows: int
    total_pages: int
    columns: List[str]
    column_types: Dict[str, str]
    data: List[Dict[str, Any]]

class QualityIssue(BaseModel):
    id: str
    category: str  # completeness, uniqueness, validity, consistency
    severity: str  # critical, warning, info
    column: Optional[str] = None
    title: str
    description: str
    affected_count: int
    affected_percentage: float
    suggested_action: str

class QualityScoreComponents(BaseModel):
    completeness: float
    uniqueness: float
    validity: float
    consistency: float

class QualityAnalysisResponse(BaseModel):
    dataset_id: str
    overall_score: float  # 0 to 100
    severity_label: str  # Excellent (90-100), Good (75-89), Fair (50-74), Poor (<50)
    components: QualityScoreComponents
    deductions: List[Dict[str, Any]]
    issues: List[QualityIssue]
    missing_by_column: List[Dict[str, Any]]
    duplicates_summary: Dict[str, Any]
    outliers_by_column: List[Dict[str, Any]]
    type_distribution: Dict[str, int]
    missingness_matrix: Optional[Dict[str, Any]] = None

class CleaningOperationRequest(BaseModel):
    operation: str  # e.g., 'remove_duplicates', 'drop_empty_rows', 'fill_missing', etc.
    column: Optional[str] = None
    columns: Optional[List[str]] = None
    method: Optional[str] = None  # 'mean', 'median', 'mode', 'custom', 'iqr'
    custom_value: Optional[Any] = None
    new_name: Optional[str] = None
    target_type: Optional[str] = None  # 'int', 'float', 'str', 'datetime'
    replace_map: Optional[Dict[str, Any]] = None
    iqr_multiplier: Optional[float] = 1.5
    filter_condition: Optional[Dict[str, Any]] = None
    column_order: Optional[List[str]] = None

class CleaningHistoryEntry(BaseModel):
    step_id: int
    timestamp: str
    operation: str
    column: Optional[str] = None
    parameters: Dict[str, Any]
    affected_rows: int
    affected_columns: int
    rows_before: int
    rows_after: int
    status: str = "success"

class CleaningOperationResponse(BaseModel):
    success: bool
    message: str
    operation: str
    history_entry: CleaningHistoryEntry
    rows_before: int
    rows_after: int
    columns_before: int
    columns_after: int
    missing_before: int
    missing_after: int
    quality_score_before: float
    quality_score_after: float

class UndoResponse(BaseModel):
    success: bool
    message: str
    remaining_steps: int
    current_rows: int
    current_columns: int
    quality_score: float

class ResetResponse(BaseModel):
    success: bool
    message: str
    rows: int
    columns: int
    quality_score: float

class NumericSummary(BaseModel):
    column: str
    count: int
    missing_count: int
    mean: Optional[float] = None
    std: Optional[float] = None
    variance: Optional[float] = None
    min: Optional[float] = None
    q25: Optional[float] = None
    median: Optional[float] = None
    q75: Optional[float] = None
    max: Optional[float] = None
    iqr: Optional[float] = None
    range: Optional[float] = None
    skewness: Optional[float] = None
    kurtosis: Optional[float] = None
    unique_count: int

class CategoricalSummary(BaseModel):
    column: str
    count: int
    missing_count: int
    unique_count: int
    top_value: Optional[str] = None
    top_frequency: Optional[int] = None
    frequencies: List[Dict[str, Any]]  # value, count, percentage
    avg_string_length: Optional[float] = None

class DateSummary(BaseModel):
    column: str
    count: int
    missing_count: int
    min_date: Optional[str] = None
    max_date: Optional[str] = None
    date_range_days: Optional[int] = None
    records_by_year: Dict[str, int]
    records_by_month: Dict[str, int]

class StatisticsResponse(BaseModel):
    dataset_id: str
    numerical_summaries: List[NumericSummary]
    categorical_summaries: List[CategoricalSummary]
    date_summaries: List[DateSummary]

class CorrelationResponse(BaseModel):
    columns: List[str]
    matrix: List[List[Optional[float]]]
    strong_correlations: List[Dict[str, Any]]

class GroupByRequest(BaseModel):
    group_column: str
    agg_column: str
    agg_function: str = "mean"  # mean, sum, count, min, max, median

class GroupByResponse(BaseModel):
    group_column: str
    agg_column: str
    agg_function: str
    data: List[Dict[str, Any]]

class VisualizationRequest(BaseModel):
    chart_type: str  # bar, line, area, histogram, scatter, bubble, pie, donut, box, violin, correlation, count, time_series, 3d_scatter
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    z_column: Optional[str] = None
    group_column: Optional[str] = None
    size_column: Optional[str] = None
    aggregation: Optional[str] = "none"  # count, sum, mean, median, min, max, none
    bins: Optional[int] = 20
    title: Optional[str] = None
    limit: Optional[int] = 1000

class VisualizationResponse(BaseModel):
    chart_type: str
    title: str
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    data: List[Dict[str, Any]]
    metadata: Dict[str, Any]

class ComparisonRequest(BaseModel):
    compare_dataset_id: str
    key_column: Optional[str] = None

class ComparisonResponse(BaseModel):
    base_id: str
    compare_id: str
    base_name: str
    compare_name: str
    row_count_diff: Dict[str, Any]
    column_count_diff: Dict[str, Any]
    common_columns: List[str]
    added_columns: List[str]
    removed_columns: List[str]
    type_differences: List[Dict[str, Any]]
    missing_comparison: List[Dict[str, Any]]
    duplicate_comparison: Dict[str, Any]
    numeric_stat_comparison: List[Dict[str, Any]]
    quality_score_comparison: Dict[str, Any]
    record_level_diff: Optional[Dict[str, Any]] = None

class InsightItem(BaseModel):
    id: str
    title: str
    category: str  # missing, anomaly, distribution, correlation, cardinality, cleaning
    severity: str  # info, warning, critical
    column: Optional[str] = None
    explanation: str
    metric_value: Optional[Union[float, str, int]] = None
    suggested_action: str

class InsightsResponse(BaseModel):
    dataset_id: str
    total_insights: int
    insights: List[InsightItem]

class DictionaryItem(BaseModel):
    column_name: str
    inferred_type: str
    non_null_count: int
    missing_count: int
    missing_percentage: float
    unique_count: int
    sample_values: List[Any]
    range_or_top_categories: str
    rule_based_description: str

class DictionaryResponse(BaseModel):
    dataset_id: str
    columns: List[DictionaryItem]
