import math
from typing import Any, Dict, List, Tuple
import numpy as np
import pandas as pd

def infer_column_type(series: pd.Series) -> str:
    """
    Infers the high-level semantic type of a Pandas series:
    - 'numeric'
    - 'datetime'
    - 'boolean'
    - 'categorical'
    - 'text'
    """
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    
    # Try parsing sample non-null values as datetime
    non_nulls = series.dropna()
    if len(non_nulls) > 0 and len(non_nulls) <= 5000:
        sample = non_nulls.head(20).astype(str)
        # Check if all look like dates
        try:
            parsed = pd.to_datetime(sample, errors='coerce')
            if parsed.notna().sum() >= len(sample) * 0.8:
                return "datetime"
        except Exception:
            pass
            
    # Check cardinality for categorical vs text
    unique_count = series.nunique()
    total_count = len(non_nulls)
    if total_count > 0:
        uniqueness_ratio = unique_count / total_count
        if uniqueness_ratio < 0.25 or unique_count <= 20:
            return "categorical"
            
    return "text"

def format_memory_size(bytes_size: int) -> str:
    """Format memory bytes into human-readable string (KB, MB, GB)."""
    if bytes_size < 1024:
        return f"{bytes_size} B"
    elif bytes_size < 1024 * 1024:
        return f"{bytes_size / 1024:.1f} KB"
    elif bytes_size < 1024 * 1024 * 1024:
        return f"{bytes_size / (1024 * 1024):.2f} MB"
    else:
        return f"{bytes_size / (1024 * 1024 * 1024):.2f} GB"

def sanitize_value_for_json(val: Any) -> Any:
    """
    Convert pandas / numpy types (NaN, NaT, Inf, numpy integers/floats, Timestamps)
    into standard JSON-compliant Python types.
    """
    if val is None:
        return None
    if isinstance(val, (float, np.floating)):
        if math.isnan(val) or np.isnan(val):
            return None
        if math.isinf(val) or np.isinf(val):
            return "Infinity" if val > 0 else "-Infinity"
        return float(val)
    if isinstance(val, (int, np.integer)):
        return int(val)
    if isinstance(val, (bool, np.bool_)):
        return bool(val)
    if isinstance(val, (pd.Series, np.ndarray, list, dict)):
        return val
    try:
        if pd.isna(val):
            return None
    except Exception:
        pass
    if isinstance(val, (pd.Timestamp, np.datetime64)):
        return str(val)
    return str(val) if not isinstance(val, (str, list, dict)) else val

def sanitize_dict_or_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Clean all records in a list of dicts for JSON safety."""
    sanitized = []
    for row in records:
        sanitized_row = {}
        for k, v in row.items():
            sanitized_row[str(k)] = sanitize_value_for_json(v)
        sanitized.append(sanitized_row)
    return sanitized
