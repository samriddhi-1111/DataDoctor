import math
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from app.models.schemas import (
    StatisticsResponse, NumericSummary, CategoricalSummary, DateSummary,
    CorrelationResponse, GroupByResponse, DictionaryItem, DictionaryResponse
)
from app.utils.dataframe_utils import infer_column_type, sanitize_value_for_json

class StatisticsService:
    @staticmethod
    def get_statistics(dataset_id: str, df: pd.DataFrame) -> StatisticsResponse:
        numeric_summaries: List[NumericSummary] = []
        categorical_summaries: List[CategoricalSummary] = []
        date_summaries: List[DateSummary] = []
        
        for col in df.columns:
            s = df[col]
            inferred = infer_column_type(s)
            null_count = int(s.isna().sum())
            non_null_count = int(s.notna().sum())
            unique_cnt = int(s.nunique(dropna=True))

            # Numerical Analysis
            if inferred == "numeric" and pd.api.types.is_numeric_dtype(s):
                clean_s = s.dropna().astype(float)
                if len(clean_s) > 0:
                    mean_val = float(clean_s.mean())
                    std_val = float(clean_s.std()) if len(clean_s) > 1 else 0.0
                    var_val = float(clean_s.var()) if len(clean_s) > 1 else 0.0
                    min_val = float(clean_s.min())
                    max_val = float(clean_s.max())
                    q25 = float(clean_s.quantile(0.25))
                    med_val = float(clean_s.median())
                    q75 = float(clean_s.quantile(0.75))
                    iqr = float(q75 - q25)
                    range_val = float(max_val - min_val)
                    skew_val = float(clean_s.skew()) if len(clean_s) > 2 else 0.0
                    kurt_val = float(clean_s.kurtosis()) if len(clean_s) > 3 else 0.0

                    numeric_summaries.append(NumericSummary(
                        column=str(col),
                        count=non_null_count,
                        missing_count=null_count,
                        mean=round(mean_val, 3),
                        std=round(std_val, 3),
                        variance=round(var_val, 3),
                        min=round(min_val, 3),
                        q25=round(q25, 3),
                        median=round(med_val, 3),
                        q75=round(q75, 3),
                        max=round(max_val, 3),
                        iqr=round(iqr, 3),
                        range=round(range_val, 3),
                        skewness=round(skew_val, 3),
                        kurtosis=round(kurt_val, 3),
                        unique_count=unique_cnt
                    ))
                else:
                    numeric_summaries.append(NumericSummary(
                        column=str(col),
                        count=0,
                        missing_count=null_count,
                        unique_count=0
                    ))

            # Date Analysis
            elif inferred == "datetime":
                try:
                    dt_s = pd.to_datetime(s, errors='coerce').dropna()
                    if len(dt_s) > 0:
                        min_d = dt_s.min()
                        max_d = dt_s.max()
                        days = int((max_d - min_d).total_seconds() // 86400)
                        
                        by_year = dt_s.dt.year.value_counts().to_dict()
                        by_year_clean = {str(k): int(v) for k, v in sorted(by_year.items())}
                        
                        by_month = dt_s.dt.strftime("%Y-%m").value_counts().to_dict()
                        by_month_clean = {str(k): int(v) for k, v in sorted(by_month.items())}

                        date_summaries.append(DateSummary(
                            column=str(col),
                            count=non_null_count,
                            missing_count=null_count,
                            min_date=str(min_d.date()),
                            max_date=str(max_d.date()),
                            date_range_days=days,
                            records_by_year=by_year_clean,
                            records_by_month=by_month_clean
                        ))
                except Exception:
                    pass

            # Categorical / Text Analysis
            else:
                clean_s = s.dropna().astype(str)
                top_v = None
                top_f = None
                freq_list = []
                avg_str_len = None

                if len(clean_s) > 0:
                    val_counts = clean_s.value_counts().head(10)
                    top_v = str(val_counts.index[0]) if len(val_counts) > 0 else None
                    top_f = int(val_counts.iloc[0]) if len(val_counts) > 0 else None
                    total_c = len(clean_s)
                    for k, v in val_counts.items():
                        freq_list.append({
                            "value": str(k),
                            "count": int(v),
                            "percentage": round((v / total_c) * 100, 2)
                        })
                    avg_str_len = round(float(clean_s.str.len().mean()), 1)

                categorical_summaries.append(CategoricalSummary(
                    column=str(col),
                    count=non_null_count,
                    missing_count=null_count,
                    unique_count=unique_cnt,
                    top_value=top_v,
                    top_frequency=top_f,
                    frequencies=freq_list,
                    avg_str_len=avg_str_len
                ))

        return StatisticsResponse(
            dataset_id=dataset_id,
            numerical_summaries=numeric_summaries,
            categorical_summaries=categorical_summaries,
            date_summaries=date_summaries
        )

    @staticmethod
    def get_correlations(df: pd.DataFrame) -> CorrelationResponse:
        numeric_df = df.select_dtypes(include=[np.number])
        cols = list(numeric_df.columns)
        if len(cols) < 2:
            return CorrelationResponse(columns=cols, matrix=[], strong_correlations=[])

        # Pearson correlation
        corr_matrix = numeric_df.corr(method="pearson").round(3)
        matrix_data = []
        strong_corrs = []

        for i, c1 in enumerate(cols):
            row = []
            for j, c2 in enumerate(cols):
                val = corr_matrix.loc[c1, c2]
                row_val = None if pd.isna(val) else float(val)
                row.append(row_val)
                if i < j and row_val is not None and abs(row_val) >= 0.65:
                    strong_corrs.append({
                        "col1": c1,
                        "col2": c2,
                        "coefficient": row_val,
                        "type": "positive" if row_val > 0 else "negative",
                        "strength": "very strong" if abs(row_val) >= 0.85 else "strong"
                    })
            matrix_data.append(row)

        # Sort strong correlations by absolute magnitude descending
        strong_corrs.sort(key=lambda x: abs(x["coefficient"]), reverse=True)

        return CorrelationResponse(
            columns=cols,
            matrix=matrix_data,
            strong_correlations=strong_corrs
        )

    @staticmethod
    def perform_groupby(df: pd.DataFrame, group_col: str, agg_col: str, agg_fn: str) -> GroupByResponse:
        if group_col not in df.columns or agg_col not in df.columns:
            return GroupByResponse(group_column=group_col, agg_column=agg_col, agg_function=agg_fn, data=[])

        fn_map = {
            "mean": "mean",
            "sum": "sum",
            "count": "count",
            "min": "min",
            "max": "max",
            "median": "median"
        }
        actual_fn = fn_map.get(agg_fn.lower(), "mean")
        
        # Ensure agg column is numeric if aggregating with math functions
        agg_series = pd.to_numeric(df[agg_col], errors='coerce') if actual_fn != "count" else df[agg_col]
        temp_df = pd.DataFrame({group_col: df[group_col], agg_col: agg_series})
        
        grouped = temp_df.groupby(group_col)[agg_col].agg(actual_fn).reset_index()
        grouped = grouped.sort_values(by=agg_col, ascending=False).head(25)
        
        result_data = []
        for _, row in grouped.iterrows():
            result_data.append({
                "group": str(row[group_col]),
                "value": round(float(row[agg_col]), 2) if isinstance(row[agg_col], (float, int, np.number)) else str(row[agg_col])
            })
            
        return GroupByResponse(
            group_column=group_col,
            agg_column=agg_col,
            agg_function=actual_fn,
            data=result_data
        )

    @staticmethod
    def get_data_dictionary(dataset_id: str, df: pd.DataFrame) -> DictionaryResponse:
        items: List[DictionaryItem] = []
        total_rows = len(df)
        
        for col in df.columns:
            s = df[col]
            inferred = infer_column_type(s)
            null_count = int(s.isna().sum())
            null_pct = round((null_count / total_rows * 100), 2) if total_rows > 0 else 0.0
            unique_cnt = int(s.nunique(dropna=True))
            samples = [sanitize_value_for_json(v) for v in s.dropna().head(4).tolist()]
            
            # Range or top categories
            range_info = ""
            rule_desc = ""
            
            if inferred == "numeric":
                clean_s = pd.to_numeric(s, errors='coerce').dropna()
                if len(clean_s) > 0:
                    range_info = f"Min: {clean_s.min():.2f}, Max: {clean_s.max():.2f}, Mean: {clean_s.mean():.2f}"
                    rule_desc = f"Continuous quantitative measurement ranging across {clean_s.max() - clean_s.min():.2f} units."
                else:
                    range_info = "No valid numeric entries"
                    rule_desc = "Numeric column with missing data."
            elif inferred == "datetime":
                dt_s = pd.to_datetime(s, errors='coerce').dropna()
                if len(dt_s) > 0:
                    range_info = f"{dt_s.min().date()} to {dt_s.max().date()}"
                    rule_desc = f"Chronological timestamp recording event progression over {(dt_s.max() - dt_s.min()).days} days."
                else:
                    range_info = "Invalid dates"
                    rule_desc = "Temporal attribute."
            elif inferred == "categorical":
                top_cats = s.dropna().value_counts().head(3).index.tolist()
                range_info = f"Top values: {', '.join([str(c) for c in top_cats])}"
                rule_desc = f"Discrete qualitative factor with {unique_cnt} categorical classes."
            else:
                range_info = f"{unique_cnt} distinct textual strings"
                rule_desc = f"Free-form text or unique identifier tokens with high cardinality ({unique_cnt} unique)."

            items.append(DictionaryItem(
                column_name=str(col),
                inferred_type=inferred,
                non_null_count=total_rows - null_count,
                missing_count=null_count,
                missing_percentage=null_pct,
                unique_count=unique_cnt,
                sample_values=samples,
                range_or_top_categories=range_info,
                rule_based_description=rule_desc
            ))

        return DictionaryResponse(dataset_id=dataset_id, columns=items)
