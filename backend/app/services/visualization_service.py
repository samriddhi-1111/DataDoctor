import math
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from app.core.errors import InvalidOperationError
from app.models.schemas import VisualizationRequest, VisualizationResponse
from app.utils.dataframe_utils import infer_column_type, sanitize_dict_or_records, sanitize_value_for_json

class VisualizationService:
    @staticmethod
    def generate_chart_data(df: pd.DataFrame, req: VisualizationRequest) -> VisualizationResponse:
        chart_type = req.chart_type.lower().strip()
        limit = min(req.limit or 1000, 2000)
        
        # 1. Bar Chart
        if chart_type == "bar":
            if not req.x_column or req.x_column not in df.columns:
                raise InvalidOperationError("X-axis column is required for Bar chart.")
            x_col = req.x_column
            y_col = req.y_column
            agg = (req.aggregation or "none").lower()

            if y_col and y_col in df.columns:
                valid_aggs = {"mean", "sum", "median", "min", "max", "count", "std"}
                effective_agg = agg if agg in valid_aggs else "mean"
                num_y = pd.to_numeric(df[y_col], errors='coerce')
                temp = pd.DataFrame({x_col: df[x_col].astype(str), y_col: num_y})
                grouped = temp.groupby(x_col, as_index=False)[y_col].agg(effective_agg)
                grouped = grouped.sort_values(by=y_col, ascending=False).head(30)
                data = [{"x": str(r[x_col]), "y": round(float(r[y_col]), 2) if pd.notna(r[y_col]) else 0} for _, r in grouped.iterrows()]
                chart_agg_label = f" ({effective_agg.capitalize()})"
            else:
                counts = df[x_col].astype(str).value_counts().head(30).reset_index()
                counts.columns = ["x", "y"]
                data = [{"x": str(r["x"]), "y": int(r["y"])} for _, r in counts.iterrows()]
                chart_agg_label = " (Frequency)"

            return VisualizationResponse(
                chart_type="bar",
                title=req.title or f"Bar Chart: {x_col}" + (f" vs {y_col}{chart_agg_label}" if y_col else chart_agg_label),
                x_column=x_col,
                y_column=y_col,
                data=data,
                metadata={"aggregation": effective_agg if (y_col and y_col in df.columns) else "frequency"}
            )

        # 2. Line Chart
        elif chart_type == "line":
            if not req.x_column or req.x_column not in df.columns:
                raise InvalidOperationError("X-axis column is required for Line chart.")
            x_col = req.x_column
            y_col = req.y_column or req.x_column
            if y_col not in df.columns:
                num_cols = df.select_dtypes(include=[np.number]).columns
                y_col = num_cols[0] if len(num_cols) > 0 else x_col
            
            agg = (req.aggregation or "none").lower()
            clean_df = df[[x_col, y_col]].dropna().copy()
            clean_df[y_col] = pd.to_numeric(clean_df[y_col], errors='coerce')
            clean_df = clean_df.dropna()

            x_is_cat = infer_column_type(clean_df[x_col]) == "categorical"
            valid_aggs = {"mean", "sum", "median", "min", "max", "count"}
            if agg in valid_aggs or (x_is_cat and clean_df[x_col].duplicated().any()):
                effective_agg = agg if agg in valid_aggs else "mean"
                grouped = clean_df.groupby(x_col, as_index=False)[y_col].agg(effective_agg)
                data = [{"x": sanitize_value_for_json(r[x_col]), "y": round(float(r[y_col]), 2)} for _, r in grouped.iterrows()]
                title_agg = f" ({effective_agg.capitalize()})"
            else:
                if infer_column_type(clean_df[x_col]) in ["datetime", "numeric"]:
                    clean_df = clean_df.sort_values(by=x_col)
                clean_df = clean_df.head(limit)
                data = [{"x": sanitize_value_for_json(r[x_col]), "y": round(float(r[y_col]), 2)} for _, r in clean_df.iterrows()]
                title_agg = ""

            return VisualizationResponse(
                chart_type="line",
                title=req.title or f"Line Chart: {y_col} across {x_col}{title_agg}",
                x_column=x_col,
                y_column=y_col,
                data=data,
                metadata={"total_points": len(data)}
            )

        # 3. Area Chart
        elif chart_type == "area":
            if not req.x_column or req.x_column not in df.columns:
                raise InvalidOperationError("X-axis column is required for Area chart.")
            x_col = req.x_column
            y_col = req.y_column or req.x_column
            if y_col not in df.columns:
                num_cols = df.select_dtypes(include=[np.number]).columns
                y_col = num_cols[0] if len(num_cols) > 0 else x_col
            
            agg = (req.aggregation or "none").lower()
            clean_df = df[[x_col, y_col]].dropna().copy()
            clean_df[y_col] = pd.to_numeric(clean_df[y_col], errors='coerce')
            clean_df = clean_df.dropna()

            x_is_cat = infer_column_type(clean_df[x_col]) == "categorical"
            valid_aggs = {"mean", "sum", "median", "min", "max", "count"}
            if agg in valid_aggs or (x_is_cat and clean_df[x_col].duplicated().any()):
                effective_agg = agg if agg in valid_aggs else "mean"
                grouped = clean_df.groupby(x_col, as_index=False)[y_col].agg(effective_agg)
                data = [{"x": sanitize_value_for_json(r[x_col]), "y": round(float(r[y_col]), 2)} for _, r in grouped.iterrows()]
                title_agg = f" ({effective_agg.capitalize()})"
            else:
                if infer_column_type(clean_df[x_col]) in ["datetime", "numeric"]:
                    clean_df = clean_df.sort_values(by=x_col)
                clean_df = clean_df.head(limit)
                data = [{"x": sanitize_value_for_json(r[x_col]), "y": round(float(r[y_col]), 2)} for _, r in clean_df.iterrows()]
                title_agg = ""

            return VisualizationResponse(
                chart_type="area",
                title=req.title or f"Area Chart: {y_col} across {x_col}{title_agg}",
                x_column=x_col,
                y_column=y_col,
                data=data,
                metadata={"points": len(data)}
            )

        # 4. Histogram
        elif chart_type == "histogram":
            target_col = None
            if req.y_column and req.y_column in df.columns and pd.api.types.is_numeric_dtype(df[req.y_column]):
                target_col = req.y_column
            elif req.x_column and req.x_column in df.columns and pd.api.types.is_numeric_dtype(df[req.x_column]):
                target_col = req.x_column
            else:
                num_cols = df.select_dtypes(include=[np.number]).columns
                if len(num_cols) > 0:
                    target_col = num_cols[0]
                else:
                    raise InvalidOperationError("No numeric column available to generate Histogram.")
            
            num_s = pd.to_numeric(df[target_col], errors='coerce').dropna()
            n_bins = max(5, min(50, req.bins or 20))
            counts, bin_edges = np.histogram(num_s, bins=n_bins)
            data = []
            for i in range(len(counts)):
                bin_label = f"{bin_edges[i]:.1f} - {bin_edges[i+1]:.1f}"
                data.append({
                    "bin": bin_label,
                    "bin_start": round(float(bin_edges[i]), 2),
                    "bin_end": round(float(bin_edges[i+1]), 2),
                    "count": int(counts[i])
                })
            return VisualizationResponse(
                chart_type="histogram",
                title=req.title or f"Distribution Histogram: {target_col}",
                x_column=target_col,
                data=data,
                metadata={"bins": n_bins, "min": float(num_s.min()), "max": float(num_s.max()), "column": target_col}
            )

        # 5. Scatter Plot
        elif chart_type == "scatter":
            if not req.x_column or not req.y_column:
                raise InvalidOperationError("Both X-axis and Y-axis are required for Scatter plot.")
            x_col = req.x_column
            y_col = req.y_column
            group_col = req.group_column if (req.group_column and req.group_column in df.columns) else None
            
            cols = [x_col, y_col] + ([group_col] if group_col else [])
            clean_df = df[cols].dropna().head(limit)
            
            data = []
            for _, r in clean_df.iterrows():
                pt = {
                    "x": sanitize_value_for_json(r[x_col]),
                    "y": sanitize_value_for_json(r[y_col])
                }
                if group_col:
                    pt["group"] = str(r[group_col])
                data.append(pt)

            return VisualizationResponse(
                chart_type="scatter",
                title=req.title or f"Scatter Plot: {x_col} vs {y_col}",
                x_column=x_col,
                y_column=y_col,
                data=data,
                metadata={"points": len(data), "grouped_by": group_col}
            )

        # 6. Bubble Chart
        elif chart_type == "bubble":
            if not req.x_column or not req.y_column:
                raise InvalidOperationError("X and Y columns are required for Bubble chart.")
            x_col = req.x_column
            y_col = req.y_column
            size_col = req.size_column or y_col
            group_col = req.group_column if (req.group_column and req.group_column in df.columns) else None
            
            cols = [x_col, y_col, size_col] + ([group_col] if group_col else [])
            clean_df = df[cols].dropna().head(limit)
            
            data = []
            for _, r in clean_df.iterrows():
                pt = {
                    "x": sanitize_value_for_json(r[x_col]),
                    "y": sanitize_value_for_json(r[y_col]),
                    "size": abs(float(r[size_col])) if pd.api.types.is_numeric_dtype(clean_df[size_col]) else 10
                }
                if group_col:
                    pt["group"] = str(r[group_col])
                data.append(pt)

            return VisualizationResponse(
                chart_type="bubble",
                title=req.title or f"Bubble Chart: {x_col} vs {y_col} (Size: {size_col})",
                x_column=x_col,
                y_column=y_col,
                data=data,
                metadata={"size_column": size_col}
            )

        # 7 & 8. Pie and Donut Charts
        elif chart_type in ["pie", "donut"]:
            if not req.x_column or req.x_column not in df.columns:
                raise InvalidOperationError("Category column (X-axis) is required for Pie/Donut chart.")
            x_col = req.x_column
            y_col = req.y_column
            agg = (req.aggregation or "sum").lower()
            
            if y_col and y_col in df.columns and y_col != x_col:
                num_y = pd.to_numeric(df[y_col], errors='coerce')
                if num_y.notna().sum() > 0:
                    valid_aggs = {"sum", "mean", "median", "count", "min", "max"}
                    effective_agg = agg if agg in valid_aggs and agg != "none" else "sum"
                    temp = pd.DataFrame({x_col: df[x_col].astype(str), y_col: num_y})
                    grouped = temp.groupby(x_col, as_index=False)[y_col].agg(effective_agg)
                    # Filter positive values for meaningful slices
                    grouped = grouped[grouped[y_col] > 0].sort_values(by=y_col, ascending=False).head(10)
                    data = [{"name": str(r[x_col]), "value": round(float(r[y_col]), 2)} for _, r in grouped.iterrows()]
                    title_suffix = f": {y_col} by {x_col} ({effective_agg.capitalize()})"
                else:
                    counts = df[x_col].astype(str).value_counts().head(10).reset_index()
                    counts.columns = ["name", "value"]
                    data = [{"name": str(r["name"]), "value": int(r["value"])} for _, r in counts.iterrows()]
                    title_suffix = f": {x_col} Composition (Count)"
            else:
                counts = df[x_col].astype(str).value_counts().head(10).reset_index()
                counts.columns = ["name", "value"]
                data = [{"name": str(r["name"]), "value": int(r["value"])} for _, r in counts.iterrows()]
                title_suffix = f": {x_col} Composition (Count)"

            chart_name = "Donut" if chart_type == "donut" else "Pie"
            return VisualizationResponse(
                chart_type=chart_type,
                title=req.title or f"{chart_name} Chart{title_suffix}",
                x_column=x_col,
                y_column=y_col,
                data=data,
                metadata={"slices": len(data), "metric": y_col or "frequency"}
            )

        # 9. Box Plot
        elif chart_type == "box":
            num_col = None
            group_col = None
            if req.y_column and req.y_column in df.columns and pd.api.types.is_numeric_dtype(df[req.y_column]):
                num_col = req.y_column
                if req.x_column and req.x_column in df.columns and req.x_column != num_col:
                    group_col = req.x_column
            elif req.x_column and req.x_column in df.columns and pd.api.types.is_numeric_dtype(df[req.x_column]):
                num_col = req.x_column
                if req.y_column and req.y_column in df.columns and req.y_column != num_col:
                    group_col = req.y_column
            else:
                num_cols = df.select_dtypes(include=[np.number]).columns
                if len(num_cols) > 0:
                    num_col = num_cols[0]
                    if req.x_column and req.x_column != num_col:
                        group_col = req.x_column
                else:
                    raise InvalidOperationError("A numerical column is required for Box plot.")
            
            data = []
            if group_col:
                top_groups = df[group_col].dropna().value_counts().head(8).index
                for g in top_groups:
                    subset = pd.to_numeric(df[df[group_col] == g][num_col], errors='coerce').dropna()
                    if len(subset) >= 3:
                        q1 = float(subset.quantile(0.25))
                        med = float(subset.median())
                        q3 = float(subset.quantile(0.75))
                        iqr = q3 - q1
                        low = float(max(subset.min(), q1 - 1.5 * iqr))
                        high = float(min(subset.max(), q3 + 1.5 * iqr))
                        data.append({
                            "group": str(g),
                            "min": round(low, 2),
                            "q1": round(q1, 2),
                            "median": round(med, 2),
                            "q3": round(q3, 2),
                            "max": round(high, 2)
                        })
            else:
                subset = pd.to_numeric(df[num_col], errors='coerce').dropna()
                if len(subset) >= 3:
                    q1 = float(subset.quantile(0.25))
                    med = float(subset.median())
                    q3 = float(subset.quantile(0.75))
                    iqr = q3 - q1
                    low = float(max(subset.min(), q1 - 1.5 * iqr))
                    high = float(min(subset.max(), q3 + 1.5 * iqr))
                    data.append({
                        "group": str(num_col),
                        "min": round(low, 2),
                        "q1": round(q1, 2),
                        "median": round(med, 2),
                        "q3": round(q3, 2),
                        "max": round(high, 2)
                    })

            return VisualizationResponse(
                chart_type="box",
                title=req.title or f"Box Plot: {num_col}" + (f" by {group_col}" if group_col else ""),
                x_column=group_col,
                y_column=num_col,
                data=data,
                metadata={"groups": len(data), "metric": num_col}
            )

        # 10. Violin Plot
        elif chart_type == "violin":
            target_col = None
            if req.y_column and req.y_column in df.columns and pd.api.types.is_numeric_dtype(df[req.y_column]):
                target_col = req.y_column
            elif req.x_column and req.x_column in df.columns and pd.api.types.is_numeric_dtype(df[req.x_column]):
                target_col = req.x_column
            else:
                num_cols = df.select_dtypes(include=[np.number]).columns
                if len(num_cols) > 0:
                    target_col = num_cols[0]
                else:
                    raise InvalidOperationError("A numerical column is required for Violin plot.")
            
            clean_s = pd.to_numeric(df[target_col], errors='coerce').dropna()
            counts, edges = np.histogram(clean_s, bins=25)
            data = []
            for i in range(len(counts)):
                midpoint = (edges[i] + edges[i+1]) / 2.0
                data.append({
                    "val": round(float(midpoint), 2),
                    "density": int(counts[i])
                })
            return VisualizationResponse(
                chart_type="violin",
                title=req.title or f"Violin Density: {target_col}",
                x_column=target_col,
                y_column=target_col,
                data=data,
                metadata={"total_samples": len(clean_s), "metric": target_col}
            )

        # 11. Correlation Heatmap
        elif chart_type == "correlation":
            num_df = df.select_dtypes(include=[np.number])
            cols = list(num_df.columns[:10])
            if req.y_column and req.y_column in num_df.columns and req.y_column not in cols:
                cols.insert(0, req.y_column)
                cols = cols[:10]
            corr = num_df[cols].corr().round(2)
            data = []
            for r in cols:
                for c in cols:
                    val = corr.loc[r, c]
                    data.append({
                        "x": str(c),
                        "y": str(r),
                        "value": round(float(val), 2) if pd.notna(val) else 0.0
                    })
            return VisualizationResponse(
                chart_type="correlation",
                title=req.title or ("Correlation Heatmap" + (f" (Focus: {req.y_column})" if req.y_column and req.y_column in num_df.columns else "")),
                data=data,
                metadata={"columns": cols}
            )

        # 12. Missing-values Chart
        elif chart_type == "missing_values":
            data = []
            total = len(df)
            for c in df.columns:
                m_count = int(df[c].isna().sum())
                data.append({
                    "column": str(c),
                    "missing_count": m_count,
                    "missing_percentage": round((m_count / total) * 100, 2) if total > 0 else 0
                })
            data.sort(key=lambda x: x["missing_count"], reverse=True)
            return VisualizationResponse(
                chart_type="missing_values",
                title=req.title or "Missing Values by Attribute",
                data=data,
                metadata={"total_rows": total}
            )

        # 13. Count Plot
        elif chart_type == "count":
            x_col = req.x_column or df.columns[0]
            y_col = req.y_column if (req.y_column and req.y_column in df.columns and req.y_column != x_col) else None
            if y_col:
                grouped = df.groupby([x_col, y_col]).size().reset_index(name="count")
                grouped = grouped.sort_values(by="count", ascending=False).head(20)
                data = [{"category": f"{r[x_col]} - {r[y_col]}", "count": int(r["count"])} for _, r in grouped.iterrows()]
                chart_title = req.title or f"Cross-Count: {x_col} by {y_col}"
            else:
                counts = df[x_col].astype(str).value_counts().head(20).reset_index()
                counts.columns = ["category", "count"]
                data = [{"category": str(r["category"]), "count": int(r["count"])} for _, r in counts.iterrows()]
                chart_title = req.title or f"Frequency Count: {x_col}"

            return VisualizationResponse(
                chart_type="count",
                title=chart_title,
                x_column=x_col,
                y_column=y_col,
                data=data,
                metadata={"categories": len(data)}
            )

        # 14. Time Series Chart
        elif chart_type == "time_series":
            x_col = req.x_column
            y_col = req.y_column
            if not x_col or not y_col:
                date_cols = [c for c in df.columns if infer_column_type(df[c]) == "datetime"]
                num_cols = list(df.select_dtypes(include=[np.number]).columns)
                x_col = x_col or (date_cols[0] if date_cols else df.columns[0])
                y_col = y_col or (num_cols[0] if num_cols else df.columns[1])
            
            agg = (req.aggregation or "mean").lower()
            valid_aggs = {"mean", "sum", "median", "min", "max"}
            effective_agg = agg if agg in valid_aggs else "mean"
            
            clean_df = pd.DataFrame({
                "date": pd.to_datetime(df[x_col], errors='coerce'),
                "value": pd.to_numeric(df[y_col], errors='coerce')
            }).dropna()
            
            clean_df = clean_df.sort_values(by="date")
            clean_df["date_str"] = clean_df["date"].dt.strftime("%Y-%m-%d")
            grouped = clean_df.groupby("date_str", as_index=False)["value"].agg(effective_agg)
            grouped = grouped.tail(limit)
            
            data = [
                {
                    "x": str(r["date_str"]),
                    "y": round(float(r["value"]), 2),
                    "date": str(r["date_str"]),
                    "value": round(float(r["value"]), 2)
                }
                for _, r in grouped.iterrows()
            ]
            return VisualizationResponse(
                chart_type="time_series",
                title=req.title or f"Time Series: {y_col} over {x_col} ({effective_agg.capitalize()})",
                x_column=x_col,
                y_column=y_col,
                data=data,
                metadata={"points": len(data), "aggregation": effective_agg}
            )

        # 15. 3D Scatter Plot
        elif chart_type == "3d_scatter":
            x_col = req.x_column
            y_col = req.y_column
            z_col = req.z_column
            if not (x_col and y_col and z_col):
                raise InvalidOperationError("Three columns (X, Y, Z) are required for 3D Scatter Plot.")
            
            group_col = req.group_column if (req.group_column and req.group_column in df.columns) else None
            cols = [x_col, y_col, z_col] + ([group_col] if group_col else [])
            clean_df = df[cols].dropna().head(500)
            
            data = []
            for _, r in clean_df.iterrows():
                pt = {
                    "x": sanitize_value_for_json(r[x_col]),
                    "y": sanitize_value_for_json(r[y_col]),
                    "z": sanitize_value_for_json(r[z_col])
                }
                if group_col:
                    pt["group"] = str(r[group_col])
                data.append(pt)

            return VisualizationResponse(
                chart_type="3d_scatter",
                title=req.title or f"3D Scatter: {x_col} × {y_col} × {z_col}",
                x_column=x_col,
                y_column=y_col,
                data=data,
                metadata={"z_column": z_col, "points": len(data)}
            )

        else:
            raise InvalidOperationError(f"Unsupported chart type '{req.chart_type}'.")
