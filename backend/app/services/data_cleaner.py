import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from app.core.errors import InvalidOperationError
from app.models.schemas import (
    CleaningOperationRequest, CleaningOperationResponse, CleaningHistoryEntry
)
from app.services.dataset_manager import dataset_manager, DatasetSession
from app.services.quality_analyzer import QualityAnalyzer

class DataCleaner:
    @staticmethod
    def apply_operation(dataset_id: str, req: CleaningOperationRequest) -> CleaningOperationResponse:
        session: DatasetSession = dataset_manager.get_session(dataset_id)
        df_before = session.working_df.copy()
        
        # Calculate before metrics
        rows_before = len(df_before)
        cols_before = len(df_before.columns)
        missing_before = int(df_before.isna().sum().sum())
        qa_before = QualityAnalyzer.analyze(dataset_id, df_before)
        score_before = qa_before.overall_score
        
        op = req.operation.lower().strip()
        working_df = df_before.copy()
        affected_rows = 0
        affected_cols = 0
        message = ""

        # 1. Remove duplicate rows
        if op == "remove_duplicates":
            init_rows = len(working_df)
            working_df = working_df.drop_duplicates()
            affected_rows = init_rows - len(working_df)
            message = f"Removed {affected_rows} duplicate rows."

        # 2. Drop rows that are entirely empty
        elif op == "drop_empty_rows":
            init_rows = len(working_df)
            working_df = working_df.dropna(how="all")
            affected_rows = init_rows - len(working_df)
            message = f"Dropped {affected_rows} entirely empty rows."

        # 3. Drop selected columns
        elif op == "drop_columns":
            columns_to_drop = req.columns or ([req.column] if req.column else [])
            if not columns_to_drop:
                raise InvalidOperationError("No columns specified to drop.")
            existing_to_drop = [c for c in columns_to_drop if c in working_df.columns]
            if not existing_to_drop:
                raise InvalidOperationError("None of the specified columns exist in dataset.")
            working_df = working_df.drop(columns=existing_to_drop)
            affected_cols = len(existing_to_drop)
            message = f"Dropped {affected_cols} column(s): {', '.join(existing_to_drop)}."

        # 4. Fill missing numeric values with mean
        elif op == "fill_missing_mean":
            col = req.column
            if not col or col not in working_df.columns:
                raise InvalidOperationError(f"Column '{col}' not found.")
            if not pd.api.types.is_numeric_dtype(working_df[col]):
                raise InvalidOperationError(f"Column '{col}' is not numeric. Cannot compute mean.")
            null_count = int(working_df[col].isna().sum())
            if null_count > 0:
                mean_val = float(working_df[col].mean())
                working_df[col] = working_df[col].fillna(mean_val)
                affected_rows = null_count
            message = f"Filled {null_count} missing value(s) in '{col}' with mean ({mean_val:.2f} if null_count > 0 else 'N/A')."

        # 5. Fill missing numeric values with median
        elif op == "fill_missing_median":
            col = req.column
            if not col or col not in working_df.columns:
                raise InvalidOperationError(f"Column '{col}' not found.")
            if not pd.api.types.is_numeric_dtype(working_df[col]):
                raise InvalidOperationError(f"Column '{col}' is not numeric. Cannot compute median.")
            null_count = int(working_df[col].isna().sum())
            if null_count > 0:
                median_val = float(working_df[col].median())
                working_df[col] = working_df[col].fillna(median_val)
                affected_rows = null_count
            message = f"Filled {null_count} missing value(s) in '{col}' with median ({median_val:.2f} if null_count > 0 else 'N/A')."

        # 6. Fill missing categorical values with mode
        elif op == "fill_missing_mode":
            col = req.column
            if not col or col not in working_df.columns:
                raise InvalidOperationError(f"Column '{col}' not found.")
            null_count = int(working_df[col].isna().sum())
            if null_count > 0:
                mode_series = working_df[col].mode(dropna=True)
                if len(mode_series) == 0:
                    raise InvalidOperationError(f"Cannot compute mode for '{col}'; all values are missing.")
                mode_val = mode_series.iloc[0]
                working_df[col] = working_df[col].fillna(mode_val)
                affected_rows = null_count
            message = f"Filled {null_count} missing value(s) in '{col}' with mode ('{mode_val}' if null_count > 0 else 'N/A')."

        # 7. Fill missing values with a custom user-provided value
        elif op == "fill_missing_custom":
            col = req.column
            if not col or col not in working_df.columns:
                raise InvalidOperationError(f"Column '{col}' not found.")
            if req.custom_value is None:
                raise InvalidOperationError("Custom replacement value is required.")
            null_count = int(working_df[col].isna().sum())
            if null_count > 0:
                val = req.custom_value
                # Try matching type
                if pd.api.types.is_numeric_dtype(working_df[col]):
                    try:
                        val = float(val) if "." in str(val) else int(val)
                    except ValueError:
                        pass
                working_df[col] = working_df[col].fillna(val)
                affected_rows = null_count
            message = f"Filled {null_count} missing value(s) in '{col}' with custom value '{req.custom_value}'."

        # 8. Drop rows containing missing values
        elif op == "drop_rows_with_missing":
            init_rows = len(working_df)
            col = req.column
            if col:
                if col not in working_df.columns:
                    raise InvalidOperationError(f"Column '{col}' not found.")
                working_df = working_df.dropna(subset=[col])
            else:
                working_df = working_df.dropna()
            affected_rows = init_rows - len(working_df)
            message = f"Dropped {affected_rows} rows containing missing values{' in ' + col if col else ''}."

        # 9. Convert column type
        elif op == "convert_type":
            col = req.column
            target = (req.target_type or "").lower().strip()
            if not col or col not in working_df.columns:
                raise InvalidOperationError(f"Column '{col}' not found.")
            if target not in ["int", "float", "str", "datetime"]:
                raise InvalidOperationError("target_type must be one of: 'int', 'float', 'str', 'datetime'.")
            
            try:
                if target == "int":
                    working_df[col] = pd.to_numeric(working_df[col], errors='coerce').round().astype("Int64")
                elif target == "float":
                    working_df[col] = pd.to_numeric(working_df[col], errors='coerce').astype(float)
                elif target == "str":
                    working_df[col] = working_df[col].astype(str)
                elif target == "datetime":
                    working_df[col] = pd.to_datetime(working_df[col], errors='coerce')
            except Exception as e:
                raise InvalidOperationError(f"Failed to convert '{col}' to {target}: {str(e)}")
            affected_cols = 1
            message = f"Converted column '{col}' to {target}."

        # 10. Rename column
        elif op == "rename_column":
            col = req.column
            new_name = (req.new_name or "").strip()
            if not col or col not in working_df.columns:
                raise InvalidOperationError(f"Column '{col}' not found.")
            if not new_name:
                raise InvalidOperationError("New column name cannot be empty.")
            if new_name in working_df.columns and new_name != col:
                raise InvalidOperationError(f"Column name '{new_name}' already exists in dataset.")
            working_df = working_df.rename(columns={col: new_name})
            affected_cols = 1
            message = f"Renamed column '{col}' to '{new_name}'."

        # 11. Normalize whitespace in text
        elif op == "normalize_whitespace":
            col = req.column
            if not col or col not in working_df.columns:
                raise InvalidOperationError(f"Column '{col}' not found.")
            working_df[col] = working_df[col].astype(str).str.replace(r"\s+", " ", regex=True).str.strip()
            affected_cols = 1
            message = f"Normalized internal and boundary whitespace in '{col}'."

        # 12. Trim leading/trailing whitespace
        elif op == "trim_whitespace":
            col = req.column
            if not col or col not in working_df.columns:
                raise InvalidOperationError(f"Column '{col}' not found.")
            working_df[col] = working_df[col].astype(str).str.strip()
            affected_cols = 1
            message = f"Trimmed leading and trailing whitespace in '{col}'."

        # 13. Replace categorical labels or values
        elif op == "replace_values":
            col = req.column
            replace_map = req.replace_map
            if not col or col not in working_df.columns:
                raise InvalidOperationError(f"Column '{col}' not found.")
            if not replace_map or not isinstance(replace_map, dict):
                raise InvalidOperationError("replace_map dictionary is required.")
            working_df[col] = working_df[col].replace(replace_map)
            affected_cols = 1
            message = f"Replaced {len(replace_map)} mapped value(s) in '{col}'."

        # 14. Filter rows using selected conditions
        elif op == "filter_rows":
            cond = req.filter_condition
            if not cond or not isinstance(cond, dict):
                raise InvalidOperationError("filter_condition object is required.")
            col = cond.get("column")
            operator = cond.get("operator")
            val = cond.get("value")
            if not col or col not in working_df.columns:
                raise InvalidOperationError(f"Column '{col}' not found.")
            
            init_rows = len(working_df)
            if operator == "equals":
                working_df = working_df[working_df[col].astype(str) == str(val)]
            elif operator == "not_equals":
                working_df = working_df[working_df[col].astype(str) != str(val)]
            elif operator == "greater_than":
                working_df = working_df[pd.to_numeric(working_df[col], errors='coerce') > float(val)]
            elif operator == "less_than":
                working_df = working_df[pd.to_numeric(working_df[col], errors='coerce') < float(val)]
            elif operator == "contains":
                working_df = working_df[working_df[col].astype(str).str.contains(str(val), case=False, na=False)]
            else:
                raise InvalidOperationError(f"Unsupported filter operator: {operator}")
            affected_rows = init_rows - len(working_df)
            message = f"Filtered dataset on '{col}' {operator} '{val}', removed {affected_rows} rows."

        # 15. Remove numerical outliers using IQR
        elif op == "remove_outliers_iqr":
            col = req.column
            if not col or col not in working_df.columns:
                raise InvalidOperationError(f"Column '{col}' not found.")
            if not pd.api.types.is_numeric_dtype(working_df[col]):
                raise InvalidOperationError(f"Column '{col}' is not numeric.")
            
            multiplier = float(req.iqr_multiplier or 1.5)
            s = working_df[col].dropna()
            q25 = s.quantile(0.25)
            q75 = s.quantile(0.75)
            iqr = q75 - q25
            lower_bound = q25 - multiplier * iqr
            upper_bound = q75 + multiplier * iqr
            
            init_rows = len(working_df)
            # Keep non-outliers (or nulls)
            mask = (working_df[col] >= lower_bound) & (working_df[col] <= upper_bound) | (working_df[col].isna())
            working_df = working_df[mask]
            affected_rows = init_rows - len(working_df)
            message = f"Removed {affected_rows} outlier row(s) in '{col}' using {multiplier}x IQR rule."

        # 16. Reorder columns
        elif op == "reorder_columns":
            new_order = req.column_order
            if not new_order or not isinstance(new_order, list):
                raise InvalidOperationError("column_order list is required.")
            existing_cols = list(working_df.columns)
            valid_new_order = [c for c in new_order if c in existing_cols]
            # Add any omitted columns to the end
            for c in existing_cols:
                if c not in valid_new_order:
                    valid_new_order.append(c)
            working_df = working_df[valid_new_order]
            affected_cols = len(valid_new_order)
            message = f"Reordered {affected_cols} columns."

        else:
            raise InvalidOperationError(f"Unknown cleaning operation '{req.operation}'.")

        # Update working DataFrame in session
        session.working_df = working_df
        
        # Calculate after metrics
        rows_after = len(working_df)
        cols_after = len(working_df.columns)
        missing_after = int(working_df.isna().sum().sum())
        qa_after = QualityAnalyzer.analyze(dataset_id, working_df)
        score_after = qa_after.overall_score

        # Create history entry
        step_id = len(session.cleaning_log) + 1
        history_entry = CleaningHistoryEntry(
            step_id=step_id,
            timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S UTC"),
            operation=req.operation,
            column=req.column,
            parameters={k: v for k, v in req.model_dump().items() if v is not None and k != "operation"},
            affected_rows=affected_rows,
            affected_columns=affected_cols,
            rows_before=rows_before,
            rows_after=rows_after,
            status="success"
        )
        session.record_step(df_before, history_entry)

        return CleaningOperationResponse(
            success=True,
            message=message,
            operation=req.operation,
            history_entry=history_entry,
            rows_before=rows_before,
            rows_after=rows_after,
            columns_before=cols_before,
            columns_after=cols_after,
            missing_before=missing_before,
            missing_after=missing_after,
            quality_score_before=score_before,
            quality_score_after=score_after
        )
