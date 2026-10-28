import io
from typing import Any, Dict, List
import pandas as pd
from app.core.errors import InvalidOperationError
from app.services.dataset_manager import dataset_manager
from app.services.quality_analyzer import QualityAnalyzer
from app.services.statistics_service import StatisticsService

class ExportService:
    @staticmethod
    def export_csv(dataset_id: str, export_type: str) -> Tuple_CSV:
        session = dataset_manager.get_session(dataset_id)
        df = session.working_df
        t = export_type.lower().strip()

        # 1. Cleaned / Working dataset
        if t in ["cleaned", "dataset", "current"]:
            csv_buf = io.StringIO()
            df.to_csv(csv_buf, index=False)
            filename = f"DataDoctor_Cleaned_{session.name}"
            return csv_buf.getvalue(), filename

        # 2. Quality issues
        elif t in ["quality_issues", "issues", "quality"]:
            qa = QualityAnalyzer.analyze(dataset_id, df)
            issues_data = [i.model_dump() for i in qa.issues]
            issues_df = pd.DataFrame(issues_data) if issues_data else pd.DataFrame([{"message": "No issues detected"}])
            csv_buf = io.StringIO()
            issues_df.to_csv(csv_buf, index=False)
            filename = f"DataDoctor_QualityIssues_{dataset_id}.csv"
            return csv_buf.getvalue(), filename

        # 3. Summary statistics
        elif t in ["statistics", "summary"]:
            stats = StatisticsService.get_statistics(dataset_id, df)
            num_data = [s.model_dump() for s in stats.numerical_summaries]
            stats_df = pd.DataFrame(num_data) if num_data else pd.DataFrame([{"message": "No numerical columns"}])
            csv_buf = io.StringIO()
            stats_df.to_csv(csv_buf, index=False)
            filename = f"DataDoctor_SummaryStats_{dataset_id}.csv"
            return csv_buf.getvalue(), filename

        # 4. Categorical frequency tables
        elif t in ["frequencies", "categorical"]:
            stats = StatisticsService.get_statistics(dataset_id, df)
            freq_rows = []
            for cat in stats.categorical_summaries:
                for f in cat.frequencies:
                    freq_rows.append({
                        "column": cat.column,
                        "category_value": f["value"],
                        "count": f["count"],
                        "percentage": f["percentage"]
                    })
            freq_df = pd.DataFrame(freq_rows) if freq_rows else pd.DataFrame([{"message": "No categorical values"}])
            csv_buf = io.StringIO()
            freq_df.to_csv(csv_buf, index=False)
            filename = f"DataDoctor_Frequencies_{dataset_id}.csv"
            return csv_buf.getvalue(), filename

        # 5. Outlier records
        elif t in ["outliers", "anomalies"]:
            outlier_indices = set()
            for col in df.select_dtypes(include=["number"]).columns:
                s = df[col].dropna()
                if len(s) >= 10:
                    q25 = s.quantile(0.25)
                    q75 = s.quantile(0.75)
                    iqr = q75 - q25
                    if iqr > 0:
                        out_idx = df[(df[col] < q25 - 1.5 * iqr) | (df[col] > q75 + 1.5 * iqr)].index
                        outlier_indices.update(out_idx)
            outlier_df = df.loc[list(outlier_indices)] if outlier_indices else pd.DataFrame([{"message": "No statistical outliers"}])
            csv_buf = io.StringIO()
            outlier_df.to_csv(csv_buf, index=False)
            filename = f"DataDoctor_OutlierRecords_{dataset_id}.csv"
            return csv_buf.getvalue(), filename

        # 6. Cleaning history
        elif t in ["history", "cleaning_history", "operations"]:
            hist_data = [h.model_dump() for h in session.cleaning_log]
            hist_df = pd.DataFrame(hist_data) if hist_data else pd.DataFrame([{"message": "No cleaning operations executed yet"}])
            csv_buf = io.StringIO()
            hist_df.to_csv(csv_buf, index=False)
            filename = f"DataDoctor_CleaningHistory_{dataset_id}.csv"
            return csv_buf.getvalue(), filename

        # 7. Data dictionary
        elif t in ["dictionary", "data_dictionary"]:
            dict_res = StatisticsService.get_data_dictionary(dataset_id, df)
            dict_df = pd.DataFrame([c.model_dump() for c in dict_res.columns])
            csv_buf = io.StringIO()
            dict_df.to_csv(csv_buf, index=False)
            filename = f"DataDoctor_DataDictionary_{dataset_id}.csv"
            return csv_buf.getvalue(), filename

        else:
            raise InvalidOperationError(f"Unsupported export type: '{export_type}'")

Tuple_CSV = tuple[str, str]
