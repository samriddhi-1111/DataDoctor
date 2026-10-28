import math
from typing import Any, Dict, List, Tuple
import numpy as np
import pandas as pd
from app.models.schemas import (
    QualityAnalysisResponse, QualityScoreComponents, QualityIssue
)
from app.utils.dataframe_utils import infer_column_type, sanitize_value_for_json

class QualityAnalyzer:
    @staticmethod
    def analyze(dataset_id: str, df: pd.DataFrame) -> QualityAnalysisResponse:
        total_rows = len(df)
        total_cols = len(df.columns)
        
        if total_rows == 0 or total_cols == 0:
            return QualityAnalysisResponse(
                dataset_id=dataset_id,
                overall_score=0.0,
                severity_label="Poor",
                components=QualityScoreComponents(
                    completeness=0.0, uniqueness=0.0, validity=0.0, consistency=0.0
                ),
                deductions=[{"category": "General", "points": 100, "reason": "Dataset is empty."}],
                issues=[QualityIssue(
                    id="empty_dataset",
                    category="completeness",
                    severity="critical",
                    title="Empty Dataset",
                    description="The dataset contains zero rows or columns.",
                    affected_count=0,
                    affected_percentage=100.0,
                    suggested_action="Upload or generate a dataset with data rows."
                )],
                missing_by_column=[],
                duplicates_summary={"count": 0, "percentage": 0.0},
                outliers_by_column=[],
                type_distribution={},
                missingness_matrix=None
            )

        total_cells = total_rows * total_cols
        issues: List[QualityIssue] = []
        deductions: List[Dict[str, Any]] = []

        # 1. COMPLETENESS EVALUATION (Weight: 35 points)
        missing_by_col = []
        total_missing_cells = 0
        for col in df.columns:
            s = df[col]
            null_cnt = int(s.isna().sum())
            total_missing_cells += null_cnt
            null_pct = round((null_cnt / total_rows) * 100, 2)
            missing_by_col.append({
                "column": str(col),
                "missing_count": null_cnt,
                "missing_percentage": null_pct,
                "data_type": str(s.dtype)
            })
            if null_pct > 25.0:
                issues.append(QualityIssue(
                    id=f"high_missing_{col}",
                    category="completeness",
                    severity="critical" if null_pct > 50 else "warning",
                    column=str(col),
                    title=f"High Missing Values in '{col}'",
                    description=f"Column has {null_cnt} missing values ({null_pct}% of total rows).",
                    affected_count=null_cnt,
                    affected_percentage=null_pct,
                    suggested_action=f"Impute missing values with mean/median/mode, or drop column if not required."
                ))
            elif null_cnt > 0:
                issues.append(QualityIssue(
                    id=f"missing_{col}",
                    category="completeness",
                    severity="info",
                    column=str(col),
                    title=f"Missing Values in '{col}'",
                    description=f"Column has {null_cnt} missing entries ({null_pct}%).",
                    affected_count=null_cnt,
                    affected_percentage=null_pct,
                    suggested_action="Use Cleaning Studio to fill with mean/median/mode or custom default."
                ))

        overall_missing_pct = (total_missing_cells / total_cells) * 100
        # Completeness score: 100 - (overall_missing_pct * 2.5), bounded [0, 100]
        completeness_score = max(0.0, round(100.0 - (overall_missing_pct * 2.5), 1))
        if overall_missing_pct > 0:
            lost_comp_points = round((100.0 - completeness_score) * 0.35, 1)
            if lost_comp_points > 0:
                deductions.append({
                    "category": "Completeness",
                    "points": lost_comp_points,
                    "reason": f"Overall missing cell rate is {overall_missing_pct:.2f}% ({total_missing_cells} cells)."
                })

        # 2. UNIQUENESS EVALUATION (Weight: 25 points)
        dup_count = int(df.duplicated().sum())
        dup_pct = round((dup_count / total_rows) * 100, 2)
        duplicates_summary = {
            "count": dup_count,
            "percentage": dup_pct,
            "total_rows": total_rows
        }
        if dup_count > 0:
            issues.append(QualityIssue(
                id="duplicate_rows",
                category="uniqueness",
                severity="warning" if dup_pct < 10 else "critical",
                column=None,
                title="Duplicate Rows Detected",
                description=f"Found {dup_count} exact duplicate rows ({dup_pct}% of dataset).",
                affected_count=dup_count,
                affected_percentage=dup_pct,
                suggested_action="Remove duplicate records in Cleaning Studio using 'Remove duplicate rows'."
            ))
            
        uniqueness_score = max(0.0, round(100.0 - (dup_pct * 3.5), 1))
        if dup_pct > 0:
            lost_uniq_points = round((100.0 - uniqueness_score) * 0.25, 1)
            if lost_uniq_points > 0:
                deductions.append({
                    "category": "Uniqueness",
                    "points": lost_uniq_points,
                    "reason": f"Duplicate rows detected: {dup_count} rows ({dup_pct}%)."
                })

        # 3. VALIDITY EVALUATION (Weight: 25 points)
        outliers_by_col = []
        total_outlier_count = 0
        validity_deduction_raw = 0.0

        for col in df.columns:
            s = df[col]
            if pd.api.types.is_numeric_dtype(s):
                clean_s = s.dropna()
                if len(clean_s) >= 10:
                    q25 = clean_s.quantile(0.25)
                    q75 = clean_s.quantile(0.75)
                    iqr = q75 - q25
                    if iqr > 0:
                        lower_bound = q25 - 1.5 * iqr
                        upper_bound = q75 + 1.5 * iqr
                        outlier_mask = (clean_s < lower_bound) | (clean_s > upper_bound)
                        col_outliers = int(outlier_mask.sum())
                        if col_outliers > 0:
                            total_outlier_count += col_outliers
                            outlier_pct = round((col_outliers / len(clean_s)) * 100, 2)
                            outliers_by_col.append({
                                "column": str(col),
                                "outlier_count": col_outliers,
                                "outlier_percentage": outlier_pct,
                                "lower_bound": round(float(lower_bound), 2),
                                "upper_bound": round(float(upper_bound), 2)
                            })
                            if outlier_pct > 3.0:
                                issues.append(QualityIssue(
                                    id=f"outliers_{col}",
                                    category="validity",
                                    severity="warning" if outlier_pct < 10 else "critical",
                                    column=str(col),
                                    title=f"Statistical Outliers in '{col}'",
                                    description=f"{col_outliers} rows ({outlier_pct}%) fall outside 1.5x IQR boundaries [{lower_bound:.2f}, {upper_bound:.2f}].",
                                    affected_count=col_outliers,
                                    affected_percentage=outlier_pct,
                                    suggested_action="Review high values or cap/filter outliers in Cleaning Studio."
                                ))
                                validity_deduction_raw += min(outlier_pct * 1.2, 15.0)

        validity_score = max(0.0, round(100.0 - validity_deduction_raw, 1))
        if validity_deduction_raw > 0:
            lost_val_points = round(validity_deduction_raw * 0.25, 1)
            deductions.append({
                "category": "Validity",
                "points": lost_val_points,
                "reason": f"Potential statistical outliers detected across {len(outliers_by_col)} numeric columns."
            })

        # 4. CONSISTENCY EVALUATION (Weight: 15 points)
        consistency_deduction_raw = 0.0
        
        # Check constant columns
        for col in df.columns:
            s = df[col]
            uniq_cnt = s.nunique(dropna=False)
            if uniq_cnt <= 1:
                issues.append(QualityIssue(
                    id=f"constant_col_{col}",
                    category="consistency",
                    severity="warning",
                    column=str(col),
                    title=f"Zero Variance / Constant Column: '{col}'",
                    description=f"Column '{col}' has only 1 distinct value across all rows, offering no predictive or diagnostic information.",
                    affected_count=total_rows,
                    affected_percentage=100.0,
                    suggested_action=f"Drop column '{col}' to streamline dataset dimensions."
                ))
                consistency_deduction_raw += 8.0
                
            # Check for inconsistent casing in categorical/text columns
            if infer_column_type(s) in ["categorical", "text"]:
                str_s = s.dropna().astype(str).str.strip()
                if len(str_s) > 0:
                    raw_unique = set(str_s.unique())
                    lower_unique = set(str_s.str.lower().unique())
                    if len(raw_unique) > len(lower_unique):
                        diff_count = len(raw_unique) - len(lower_unique)
                        issues.append(QualityIssue(
                            id=f"casing_inconsistency_{col}",
                            category="consistency",
                            severity="info",
                            column=str(col),
                            title=f"Case Sensitivity Inconsistency in '{col}'",
                            description=f"Found {diff_count} category variants differing only in text casing (e.g., 'Category' vs 'category').",
                            affected_count=diff_count,
                            affected_percentage=round((diff_count / total_rows) * 100, 2),
                            suggested_action=f"Normalize whitespace and casing using Cleaning Studio."
                        ))
                        consistency_deduction_raw += 5.0

        consistency_score = max(0.0, round(100.0 - consistency_deduction_raw, 1))
        if consistency_deduction_raw > 0:
            lost_cons_points = round(consistency_deduction_raw * 0.15, 1)
            deductions.append({
                "category": "Consistency",
                "points": lost_cons_points,
                "reason": "Presence of constant columns or category casing variances."
            })

        # OVERALL WEIGHTED DATA-QUALITY SCORE
        overall_score = round(
            (completeness_score * 0.35) +
            (uniqueness_score * 0.25) +
            (validity_score * 0.25) +
            (consistency_score * 0.15),
            1
        )
        overall_score = max(0.0, min(100.0, overall_score))

        if overall_score >= 90.0:
            severity_label = "Excellent"
        elif overall_score >= 75.0:
            severity_label = "Good"
        elif overall_score >= 50.0:
            severity_label = "Fair"
        else:
            severity_label = "Poor"

        # Type distribution
        type_distribution: Dict[str, int] = {}
        for col in df.columns:
            t = infer_column_type(df[col])
            type_distribution[t] = type_distribution.get(t, 0) + 1

        # Missingness matrix sample (sample up to 40 rows for heatmap)
        sample_size = min(40, total_rows)
        sample_df = df.iloc[:sample_size]
        missing_matrix = {
            "columns": [str(c) for c in df.columns],
            "rows": [
                {
                    "row_index": i,
                    "missing_cols": [str(c) for c in df.columns if pd.isna(sample_df.iloc[i][c])]
                }
                for i in range(sample_size)
            ]
        }

        return QualityAnalysisResponse(
            dataset_id=dataset_id,
            overall_score=overall_score,
            severity_label=severity_label,
            components=QualityScoreComponents(
                completeness=completeness_score,
                uniqueness=uniqueness_score,
                validity=validity_score,
                consistency=consistency_score
            ),
            deductions=deductions,
            issues=issues,
            missing_by_column=missing_by_col,
            duplicates_summary=duplicates_summary,
            outliers_by_column=outliers_by_col,
            type_distribution=type_distribution,
            missingness_matrix=missing_matrix
        )
