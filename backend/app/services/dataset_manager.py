import copy
import io
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from app.core.config import settings
from app.core.errors import DatasetNotFoundError, InvalidOperationError
from app.models.schemas import (
    ColumnMeta, DatasetMetadata, PreviewResponse, CleaningHistoryEntry
)
from app.utils.dataframe_utils import (
    infer_column_type, format_memory_size, sanitize_dict_or_records, sanitize_value_for_json
)

class DatasetSession:
    def __init__(self, dataset_id: str, name: str, original_df: pd.DataFrame):
        self.dataset_id = dataset_id
        self.name = name
        self.original_df = original_df.copy()
        self.working_df = original_df.copy()
        # Stack for undo support (stores copies of working_df before changes)
        self.history_stack: List[Tuple[pd.DataFrame, CleaningHistoryEntry]] = []
        self.cleaning_log: List[CleaningHistoryEntry] = []
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.updated_at = self.created_at
        # Cached analysis
        self._quality_cache: Optional[Dict[str, Any]] = None
        self._stats_cache: Optional[Dict[str, Any]] = None
        self._insights_cache: Optional[Dict[str, Any]] = None

    def invalidate_cache(self):
        self._quality_cache = None
        self._stats_cache = None
        self._insights_cache = None
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def record_step(self, df_before: pd.DataFrame, entry: CleaningHistoryEntry):
        # Keep maximum 15 undo steps to conserve memory
        if len(self.history_stack) >= 15:
            self.history_stack.pop(0)
        self.history_stack.append((df_before.copy(), entry))
        self.cleaning_log.append(entry)
        self.invalidate_cache()

    def undo(self) -> Optional[CleaningHistoryEntry]:
        if not self.history_stack:
            return None
        prev_df, last_entry = self.history_stack.pop()
        self.working_df = prev_df
        # Remove from log or mark as undone
        if self.cleaning_log and self.cleaning_log[-1].step_id == last_entry.step_id:
            self.cleaning_log.pop()
        self.invalidate_cache()
        return last_entry

    def reset_to_original(self):
        self.working_df = self.original_df.copy()
        self.history_stack.clear()
        self.cleaning_log.clear()
        self.invalidate_cache()


class DatasetManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatasetManager, cls).__new__(cls)
            cls._instance.sessions: Dict[str, DatasetSession] = {}
        return cls._instance

    def create_session_from_csv(self, filename: str, content: bytes, encoding: str = "utf-8") -> str:
        dataset_id = str(uuid.uuid4())[:8]
        stream = io.BytesIO(content)
        df = pd.read_csv(stream, encoding=encoding)
        
        # Ensure column names are clean strings
        df.columns = [str(c).strip() for c in df.columns]
        
        session = DatasetSession(dataset_id=dataset_id, name=filename, original_df=df)
        self.sessions[dataset_id] = session
        return dataset_id

    def create_demo_dataset(self) -> str:
        """
        Generates at least 500 realistic synthetic records for Retail Sales & Customer Analytics.
        Includes numerical, categorical, and date columns.
        Includes controlled missing values, duplicates, and outliers for quality diagnostics.
        Deterministic via fixed random seed (42).
        """
        np.random.seed(42)
        n_rows = 550
        
        customer_ids = [f"CUST-{1000 + i}" for i in range(n_rows)]
        
        # Categorical columns
        regions = ["North", "South", "East", "West", "Central"]
        categories = ["Electronics", "Home & Kitchen", "Fashion", "Sports & Fitness", "Books"]
        payment_methods = ["Credit Card", "UPI / Digital Wallet", "Net Banking", "Cash on Delivery", "Debit Card"]
        customer_tiers = ["Bronze", "Silver", "Gold", "Platinum"]
        
        # Generate realistic values
        region_vals = np.random.choice(regions, size=n_rows, p=[0.25, 0.20, 0.22, 0.18, 0.15])
        category_vals = np.random.choice(categories, size=n_rows, p=[0.30, 0.25, 0.20, 0.15, 0.10])
        payment_vals = np.random.choice(payment_methods, size=n_rows, p=[0.35, 0.30, 0.15, 0.12, 0.08])
        tier_vals = np.random.choice(customer_tiers, size=n_rows, p=[0.40, 0.30, 0.20, 0.10])
        
        # Numerical columns with realistic relationships
        # Age: 18 - 72
        age_vals = np.random.normal(38, 12, size=n_rows).round().astype(int)
        age_vals = np.clip(age_vals, 18, 75)
        
        # Units Purchased: 1 to 10
        units_vals = np.random.poisson(3, size=n_rows) + 1
        
        # Unit Price: $15 to $850
        unit_prices = np.random.exponential(120, size=n_rows) + 19.99
        unit_prices = np.round(unit_prices, 2)
        
        # Total Amount = Units * Price * discount factor
        discounts = np.random.choice([0.0, 0.05, 0.10, 0.15, 0.20], size=n_rows, p=[0.4, 0.25, 0.15, 0.1, 0.1])
        total_amounts = np.round(units_vals * unit_prices * (1 - discounts), 2)
        
        # Customer Satisfaction Rating: 1 to 5 (with some missing)
        ratings = np.random.choice([1, 2, 3, 4, 5], size=n_rows, p=[0.05, 0.08, 0.22, 0.40, 0.25]).astype(float)
        
        # Date column: sales over past 18 months
        start_date = pd.Timestamp("2025-01-01")
        date_offsets = np.random.randint(0, 500, size=n_rows)
        order_dates = [start_date + pd.Timedelta(days=int(d)) for d in date_offsets]
        order_dates_str = [d.strftime("%Y-%m-%d") for d in order_dates]
        
        # Intentionally introduce controlled anomalies:
        # 4. Outliers in Total_Revenue and Units_Sold (bulk purchases)
        outlier_indices = [15, 88, 230, 410]
        for idx, rev, units in zip(outlier_indices, [14850.00, 18900.50, 22400.00, 16750.25], [45, 60, 75, 52]):
            total_amounts[idx] = rev
            units_vals[idx] = units

        # Assemble DataFrame
        df = pd.DataFrame({
            "Transaction_ID": [f"TXN-{10000 + i}" for i in range(n_rows)],
            "Customer_ID": customer_ids,
            "Order_Date": order_dates_str,
            "Region": region_vals,
            "Customer_Tier": tier_vals,
            "Product_Category": category_vals,
            "Customer_Age": age_vals.astype(float),
            "Units_Sold": units_vals.astype(float),
            "Unit_Price": unit_prices,
            "Discount": discounts,
            "Total_Revenue": total_amounts,
            "Payment_Method": payment_vals,
            "Satisfaction_Rating": ratings,
        })
        
        # 1. Missing values in Satisfaction_Rating (about 12% missing)
        missing_rating_indices = np.random.choice(n_rows, size=65, replace=False)
        df.loc[missing_rating_indices, "Satisfaction_Rating"] = np.nan
        
        # 2. Missing values in Customer_Age (about 5% missing)
        missing_age_indices = np.random.choice(n_rows, size=28, replace=False)
        df.loc[missing_age_indices, "Customer_Age"] = np.nan
        
        # 3. Missing values in Payment_Method (about 3% missing)
        missing_pay_indices = np.random.choice(n_rows, size=18, replace=False)
        df.loc[missing_pay_indices, "Payment_Method"] = np.nan
        
        # 5. Duplicate rows (duplicate 12 random rows to test duplicate detection and removal)
        dup_indices = np.random.choice(n_rows, size=12, replace=False)
        duplicate_rows = df.iloc[dup_indices].copy()
        df = pd.concat([df, duplicate_rows], ignore_index=True)
        
        dataset_id = "demo_retail_500"
        session = DatasetSession(
            dataset_id=dataset_id,
            name="Synthetic_Retail_Sales_Demo.csv",
            original_df=df
        )
        self.sessions[dataset_id] = session
        return dataset_id

    def get_session(self, dataset_id: str) -> DatasetSession:
        if dataset_id not in self.sessions:
            raise DatasetNotFoundError(dataset_id)
        return self.sessions[dataset_id]

    def get_metadata(self, dataset_id: str) -> DatasetMetadata:
        session = self.get_session(dataset_id)
        df = session.working_df
        
        total_rows = len(df)
        total_cols = len(df.columns)
        mem_bytes = int(df.memory_usage(deep=True).sum()) if not df.empty else 0
        
        # Count types
        num_cols = 0
        cat_cols = 0
        date_cols = 0
        columns_meta: List[ColumnMeta] = []
        
        for col in df.columns:
            s = df[col]
            inferred = infer_column_type(s)
            if inferred == "numeric":
                num_cols += 1
            elif inferred == "datetime":
                date_cols += 1
            else:
                cat_cols += 1
                
            null_count = int(s.isna().sum())
            null_pct = round((null_count / total_rows * 100), 2) if total_rows > 0 else 0.0
            unique_cnt = int(s.nunique(dropna=True))
            samples = [sanitize_value_for_json(v) for v in s.dropna().head(5).tolist()]
            
            columns_meta.append(ColumnMeta(
                name=str(col),
                dtype=str(s.dtype),
                inferred_type=inferred,
                null_count=null_count,
                null_percentage=null_pct,
                unique_count=unique_cnt,
                sample_values=samples
            ))
            
        missing_total = int(df.isna().sum().sum())
        total_cells = (total_rows * total_cols) if (total_rows * total_cols) > 0 else 1
        missing_pct = round((missing_total / total_cells) * 100, 2)
        
        dup_count = int(df.duplicated().sum()) if total_rows > 0 else 0
        dup_pct = round((dup_count / total_rows) * 100, 2) if total_rows > 0 else 0.0
        
        return DatasetMetadata(
            dataset_id=session.dataset_id,
            name=session.name,
            total_rows=total_rows,
            total_columns=total_cols,
            memory_usage_bytes=mem_bytes,
            memory_usage_formatted=format_memory_size(mem_bytes),
            numerical_columns_count=num_cols,
            categorical_columns_count=cat_cols,
            datetime_columns_count=date_cols,
            missing_cells_total=missing_total,
            missing_cells_percentage=missing_pct,
            duplicate_rows_count=dup_count,
            duplicate_rows_percentage=dup_pct,
            columns=columns_meta,
            created_at=session.created_at,
            updated_at=session.updated_at
        )

    def get_preview(
        self,
        dataset_id: str,
        page: int = 1,
        page_size: int = 25,
        sort_by: Optional[str] = None,
        sort_descending: bool = False,
        search: Optional[str] = None,
        selected_columns: Optional[List[str]] = None,
        filters: Optional[List[Dict[str, Any]]] = None
    ) -> PreviewResponse:
        session = self.get_session(dataset_id)
        df = session.working_df.copy()
        
        # 1. Column selection
        if selected_columns:
            valid_cols = [c for c in selected_columns if c in df.columns]
            if valid_cols:
                df = df[valid_cols]
                
        # 2. Search query across displayed rows
        if search and search.strip():
            query = search.strip().lower()
            mask = df.astype(str).apply(lambda row: row.str.lower().str.contains(query, regex=False).any(), axis=1)
            df = df[mask]
            
        # 3. Filters
        if filters:
            for f in filters:
                col = f.get("column")
                operator = f.get("operator")
                val = f.get("value")
                if col in df.columns and val is not None:
                    if operator == "equals":
                        df = df[df[col].astype(str) == str(val)]
                    elif operator == "not_equals":
                        df = df[df[col].astype(str) != str(val)]
                    elif operator == "contains":
                        df = df[df[col].astype(str).str.contains(str(val), case=False, na=False)]
                    elif operator == "greater_than":
                        try:
                            df = df[pd.to_numeric(df[col], errors='coerce') > float(val)]
                        except Exception:
                            pass
                    elif operator == "less_than":
                        try:
                            df = df[pd.to_numeric(df[col], errors='coerce') < float(val)]
                        except Exception:
                            pass
                    elif operator == "is_null":
                        df = df[df[col].isna()]
                    elif operator == "not_null":
                        df = df[df[col].notna()]

        total_filtered_rows = len(df)
        
        # 4. Sorting
        if sort_by and sort_by in df.columns:
            df = df.sort_values(by=sort_by, ascending=not sort_descending)
            
        # 5. Pagination
        page = max(1, page)
        page_size = max(5, min(100, page_size))
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        page_df = df.iloc[start_idx:end_idx]
        total_pages = max(1, (total_filtered_rows + page_size - 1) // page_size)
        
        # Column types dict
        col_types = {col: infer_column_type(session.working_df[col]) for col in df.columns}
        
        # Format records for JSON
        records = page_df.to_dict(orient="records")
        clean_records = sanitize_dict_or_records(records)
        
        return PreviewResponse(
            dataset_id=dataset_id,
            page=page,
            page_size=page_size,
            total_rows=len(session.working_df),
            total_filtered_rows=total_filtered_rows,
            total_pages=total_pages,
            columns=list(df.columns),
            column_types=col_types,
            data=clean_records
        )

# Global singleton
dataset_manager = DatasetManager()
