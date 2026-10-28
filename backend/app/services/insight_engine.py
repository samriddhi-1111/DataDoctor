from typing import Any, Dict, List
import numpy as np
import pandas as pd
from app.models.schemas import InsightItem, InsightsResponse
from app.services.dataset_manager import dataset_manager
from app.utils.dataframe_utils import infer_column_type

class InsightEngine:
    @staticmethod
    def generate_insights(dataset_id: str) -> InsightsResponse:
        session = dataset_manager.get_session(dataset_id)
        df = session.working_df
        total_rows = len(df)
        
        insights: List[InsightItem] = []
        if total_rows == 0:
            return InsightsResponse(dataset_id=dataset_id, total_insights=0, insights=[])

        # 1. Cleaning operation impact insights
        if session.cleaning_log:
            last_op = session.cleaning_log[-1]
            insights.append(InsightItem(
                id="recent_cleaning_impact",
                title=f"Recent Cleaning Impact: {last_op.operation}",
                category="cleaning",
                severity="info",
                column=last_op.column,
                explanation=f"Applied '{last_op.operation}' impacting {last_op.affected_rows} rows and {last_op.affected_columns} columns.",
                metric_value=f"{last_op.affected_rows} rows",
                suggested_action="Review before/after quality metrics or undo if unintended."
            ))

        # 2. Missing data insights
        for col in df.columns:
            s = df[col]
            null_cnt = int(s.isna().sum())
            null_pct = round((null_cnt / total_rows) * 100, 2)
            if null_pct >= 20.0:
                insights.append(InsightItem(
                    id=f"high_nulls_{col}",
                    title=f"Critical Data Sparsity in '{col}'",
                    category="missing",
                    severity="critical" if null_pct > 40 else "warning",
                    column=str(col),
                    explanation=f"{null_pct}% of entries ({null_cnt} rows) are missing in '{col}'. Statistical estimators may be biased.",
                    metric_value=f"{null_pct}% missing",
                    suggested_action="Impute with median/mean or consider column removal if missingness exceeds 60%."
                ))

        # 3. High Uniqueness / Candidate Primary Key
        for col in df.columns:
            s = df[col]
            uniq_cnt = s.nunique(dropna=True)
            if total_rows > 10 and uniq_cnt == total_rows and s.isna().sum() == 0:
                insights.append(InsightItem(
                    id=f"candidate_key_{col}",
                    title=f"Candidate Primary Key: '{col}'",
                    category="cardinality",
                    severity="info",
                    column=str(col),
                    explanation=f"Column '{col}' is 100% unique and completely non-null. It functions as a unique record identifier.",
                    metric_value=f"{uniq_cnt} unique values",
                    suggested_action="Use '{col}' as the primary match key during dataset comparisons."
                ))

        # 4. Extreme Category Imbalance
        for col in df.columns:
            s = df[col]
            if infer_column_type(s) == "categorical":
                counts = s.dropna().value_counts()
                if len(counts) > 1:
                    top_freq = counts.iloc[0]
                    top_val = counts.index[0]
                    top_pct = round((top_freq / len(s.dropna())) * 100, 1)
                    if top_pct >= 80.0:
                        insights.append(InsightItem(
                            id=f"imbalance_{col}",
                            category="distribution",
                            severity="warning",
                            column=str(col),
                            title=f"Dominant Category Imbalance in '{col}'",
                            explanation=f"Class '{top_val}' accounts for {top_pct}% of non-null records, indicating extreme skew.",
                            metric_value=f"{top_pct}% '{top_val}'",
                            suggested_action="Be cautious when aggregating across minority classes in this attribute."
                        ))

        # 5. Skewness and Distribution Shape
        num_cols = df.select_dtypes(include=[np.number]).columns
        for col in num_cols:
            clean_s = df[col].dropna()
            if len(clean_s) >= 15:
                skew_val = float(clean_s.skew())
                if abs(skew_val) >= 1.5:
                    direction = "right-skewed (positive tail)" if skew_val > 0 else "left-skewed (negative tail)"
                    insights.append(InsightItem(
                        id=f"skew_{col}",
                        category="distribution",
                        severity="info",
                        column=str(col),
                        title=f"Strong Distribution Skew in '{col}'",
                        explanation=f"Skewness coefficient is {skew_val:.2f}, indicating a heavily {direction} distribution.",
                        metric_value=round(skew_val, 2),
                        suggested_action="Consider log or square-root transform for predictive modeling, or use median over mean."
                    ))

        # 6. Statistical Outliers
        for col in num_cols:
            clean_s = df[col].dropna()
            if len(clean_s) >= 10:
                q25 = clean_s.quantile(0.25)
                q75 = clean_s.quantile(0.75)
                iqr = q75 - q25
                if iqr > 0:
                    outliers = clean_s[(clean_s < q25 - 1.5 * iqr) | (clean_s > q75 + 1.5 * iqr)]
                    if len(outliers) > 0:
                        out_pct = round((len(outliers) / len(clean_s)) * 100, 1)
                        if out_pct >= 2.0:
                            insights.append(InsightItem(
                                id=f"outlier_insight_{col}",
                                category="anomaly",
                                severity="warning",
                                column=str(col),
                                title=f"Potential Anomalies in '{col}'",
                                explanation=f"Found {len(outliers)} records ({out_pct}%) exceeding 1.5x IQR boundaries.",
                                metric_value=f"{len(outliers)} outliers",
                                suggested_action="Inspect the records in Data Quality or filter via Cleaning Studio."
                            ))

        # 7. Strong Bivariate Correlation
        if len(num_cols) >= 2:
            corr_matrix = df[num_cols].corr(method="pearson")
            for i, c1 in enumerate(num_cols):
                for j, c2 in enumerate(num_cols):
                    if i < j:
                        r = corr_matrix.loc[c1, c2]
                        if pd.notna(r) and abs(r) >= 0.75:
                            insights.append(InsightItem(
                                id=f"corr_{c1}_{c2}",
                                category="correlation",
                                severity="info",
                                column=f"{c1} & {c2}",
                                title=f"Strong Correlation: '{c1}' & '{c2}'",
                                explanation=f"Pearson coefficient r = {r:.2f}. These attributes exhibit strong {'collinear' if r > 0 else 'inverse'} co-movement.",
                                metric_value=round(float(r), 2),
                                suggested_action="Verify redundancy or multicollinearity if engineering regression features."
                            ))

        # Sort insights by severity: critical > warning > info
        sev_rank = {"critical": 0, "warning": 1, "info": 2}
        insights.sort(key=lambda x: sev_rank.get(x.severity, 3))
        
        # Limit to top 15 most prominent insights to avoid noise
        prioritized = insights[:15]

        return InsightsResponse(
            dataset_id=dataset_id,
            total_insights=len(prioritized),
            insights=prioritized
        )
