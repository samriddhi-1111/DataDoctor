from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from app.models.schemas import ComparisonResponse
from app.services.dataset_manager import dataset_manager
from app.services.quality_analyzer import QualityAnalyzer
from app.utils.dataframe_utils import infer_column_type

class ComparisonService:
    @staticmethod
    def compare(base_id: str, compare_id: str, key_col: Optional[str] = None) -> ComparisonResponse:
        base_session = dataset_manager.get_session(base_id)
        compare_session = dataset_manager.get_session(compare_id)
        
        df1 = base_session.working_df
        df2 = compare_session.working_df
        
        # 1. Dimensions
        row_diff = {
            "base_rows": len(df1),
            "compare_rows": len(df2),
            "diff": len(df2) - len(df1),
            "percentage_change": round(((len(df2) - len(df1)) / max(len(df1), 1)) * 100, 2)
        }
        col_diff = {
            "base_cols": len(df1.columns),
            "compare_cols": len(df2.columns),
            "diff": len(df2.columns) - len(df1.columns)
        }
        
        # 2. Schema / Columns
        cols1 = set(df1.columns)
        cols2 = set(df2.columns)
        common_cols = sorted(list(cols1.intersection(cols2)))
        added_cols = sorted(list(cols2 - cols1))
        removed_cols = sorted(list(cols1 - cols2))
        
        # 3. Type differences in common columns
        type_differences = []
        for col in common_cols:
            t1 = infer_column_type(df1[col])
            t2 = infer_column_type(df2[col])
            if t1 != t2:
                type_differences.append({
                    "column": col,
                    "base_type": t1,
                    "compare_type": t2
                })
                
        # 4. Missing value comparison
        missing_comparison = []
        for col in common_cols:
            m1 = int(df1[col].isna().sum())
            m2 = int(df2[col].isna().sum())
            p1 = round((m1 / max(len(df1), 1)) * 100, 2)
            p2 = round((m2 / max(len(df2), 1)) * 100, 2)
            missing_comparison.append({
                "column": col,
                "base_missing": m1,
                "base_pct": p1,
                "compare_missing": m2,
                "compare_pct": p2,
                "diff": m2 - m1
            })
            
        # 5. Duplicates comparison
        dup1 = int(df1.duplicated().sum())
        dup2 = int(df2.duplicated().sum())
        dup_comp = {
            "base_duplicates": dup1,
            "base_pct": round((dup1 / max(len(df1), 1)) * 100, 2),
            "compare_duplicates": dup2,
            "compare_pct": round((dup2 / max(len(df2), 1)) * 100, 2),
            "diff": dup2 - dup1
        }
        
        # 6. Numeric Statistics comparison
        stat_comp = []
        for col in common_cols:
            if pd.api.types.is_numeric_dtype(df1[col]) and pd.api.types.is_numeric_dtype(df2[col]):
                s1 = df1[col].dropna()
                s2 = df2[col].dropna()
                if len(s1) > 0 and len(s2) > 0:
                    stat_comp.append({
                        "column": col,
                        "base_mean": round(float(s1.mean()), 2),
                        "compare_mean": round(float(s2.mean()), 2),
                        "mean_diff": round(float(s2.mean() - s1.mean()), 2),
                        "base_std": round(float(s1.std()), 2) if len(s1) > 1 else 0.0,
                        "compare_std": round(float(s2.std()), 2) if len(s2) > 1 else 0.0,
                        "base_min": round(float(s1.min()), 2),
                        "compare_min": round(float(s2.min()), 2),
                        "base_max": round(float(s1.max()), 2),
                        "compare_max": round(float(s2.max()), 2)
                    })
                    
        # 7. Quality scores comparison
        qa1 = QualityAnalyzer.analyze(base_id, df1)
        qa2 = QualityAnalyzer.analyze(compare_id, df2)
        quality_comp = {
            "base_score": qa1.overall_score,
            "base_label": qa1.severity_label,
            "compare_score": qa2.overall_score,
            "compare_label": qa2.severity_label,
            "score_diff": round(qa2.overall_score - qa1.overall_score, 1)
        }
        
        # 8. Record-level comparison if key column is specified and valid
        record_level = None
        if key_col and key_col in common_cols:
            k1 = set(df1[key_col].dropna().astype(str))
            k2 = set(df2[key_col].dropna().astype(str))
            common_keys = k1.intersection(k2)
            added_keys = k2 - k1
            removed_keys = k1 - k2
            
            # Count modified values for common keys
            other_common = [c for c in common_cols if c != key_col]
            modified_records = 0
            check_keys = list(common_keys)[:500]
            if other_common:
                df1_sub = df1[df1[key_col].astype(str).isin(check_keys)].set_index(key_col)[other_common]
                df2_sub = df2[df2[key_col].astype(str).isin(check_keys)].set_index(key_col)[other_common]
                diff_mask = (df1_sub.astype(str) != df2_sub.astype(str)).any(axis=1)
                modified_records = int(diff_mask.sum())
            
            record_level = {
                "key_column": key_col,
                "common_records_count": len(common_keys),
                "added_records_count": len(added_keys),
                "removed_records_count": len(removed_keys),
                "sample_modified_records_count": modified_records,
                "sample_checked_records": len(check_keys)
            }

        return ComparisonResponse(
            base_id=base_id,
            compare_id=compare_id,
            base_name=base_session.name,
            compare_name=compare_session.name,
            row_count_diff=row_diff,
            column_count_diff=col_diff,
            common_columns=common_cols,
            added_columns=added_cols,
            removed_columns=removed_cols,
            type_differences=type_differences,
            missing_comparison=missing_comparison,
            duplicate_comparison=dup_comp,
            numeric_stat_comparison=stat_comp,
            quality_score_comparison=quality_comp,
            record_level_diff=record_level
        )
