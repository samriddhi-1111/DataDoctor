import io
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.dataset_manager import dataset_manager

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "DataDoctor" in data["service"]

def test_load_demo_dataset():
    response = client.post("/api/datasets/demo")
    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] >= 500
    assert data["total_columns"] >= 10
    assert data["missing_cells_total"] > 0
    assert data["duplicate_rows_count"] > 0
    assert "columns" in data

def test_csv_upload_valid():
    csv_content = b"Name,Age,Salary,City\nAlice,30,70000,New York\nBob,25,50000,London\nCharlie,35,90000,Paris\n"
    response = client.post(
        "/api/datasets/upload",
        files={"file": ("test_data.csv", csv_content, "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] == 3
    assert data["total_columns"] == 4

def test_csv_upload_empty_file():
    response = client.post(
        "/api/datasets/upload",
        files={"file": ("empty.csv", b"", "text/csv")}
    )
    assert response.status_code == 422
    assert "empty" in response.json()["detail"].lower()

def test_csv_upload_invalid_extension():
    response = client.post(
        "/api/datasets/upload",
        files={"file": ("test.txt", b"some text", "text/plain")}
    )
    assert response.status_code == 422
    assert "extension" in response.json()["detail"].lower()

def test_dataset_metadata_and_preview():
    # Load demo
    demo_res = client.post("/api/datasets/demo").json()
    dataset_id = demo_res["dataset_id"]

    # Metadata
    meta_res = client.get(f"/api/datasets/{dataset_id}/metadata")
    assert meta_res.status_code == 200
    meta = meta_res.json()
    assert meta["dataset_id"] == dataset_id
    assert len(meta["columns"]) == meta["total_columns"]

    # Preview with pagination
    prev_res = client.post(f"/api/datasets/{dataset_id}/preview", json={"page": 1, "page_size": 10})
    assert prev_res.status_code == 200
    prev = prev_res.json()
    assert len(prev["data"]) == 10
    assert prev["total_pages"] > 1

    # Search filter in preview
    search_res = client.post(f"/api/datasets/{dataset_id}/preview", json={"page": 1, "page_size": 10, "search": "TXN-"})
    assert search_res.status_code == 200
    assert len(search_res.json()["data"]) > 0

def test_data_quality_analysis():
    demo_res = client.post("/api/datasets/demo").json()
    dataset_id = demo_res["dataset_id"]

    q_res = client.get(f"/api/datasets/{dataset_id}/quality")
    assert q_res.status_code == 200
    qa = q_res.json()
    assert 0.0 <= qa["overall_score"] <= 100.0
    assert qa["severity_label"] in ["Excellent", "Good", "Fair", "Poor"]
    assert "completeness" in qa["components"]
    assert "uniqueness" in qa["components"]
    assert "validity" in qa["components"]
    assert "consistency" in qa["components"]
    assert len(qa["issues"]) > 0

def test_cleaning_operations_and_undo_reset():
    demo_res = client.post("/api/datasets/demo").json()
    dataset_id = demo_res["dataset_id"]
    initial_rows = demo_res["total_rows"]
    initial_dups = demo_res["duplicate_rows_count"]

    # Op 1: Remove duplicates
    clean_res1 = client.post(
        f"/api/datasets/{dataset_id}/clean",
        json={"operation": "remove_duplicates"}
    )
    assert clean_res1.status_code == 200
    c1 = clean_res1.json()
    assert c1["success"] is True
    assert c1["rows_after"] == initial_rows - initial_dups
    assert c1["history_entry"]["operation"] == "remove_duplicates"

    # Op 2: Fill missing numeric with mean
    clean_res2 = client.post(
        f"/api/datasets/{dataset_id}/clean",
        json={"operation": "fill_missing_mean", "column": "Satisfaction_Rating"}
    )
    assert clean_res2.status_code == 200
    assert clean_res2.json()["success"] is True

    # Op 3: Rename column
    clean_res3 = client.post(
        f"/api/datasets/{dataset_id}/clean",
        json={"operation": "rename_column", "column": "Customer_Tier", "new_name": "Membership_Level"}
    )
    assert clean_res3.status_code == 200
    assert clean_res3.json()["success"] is True

    # Verify column renamed in columns endpoint
    cols_res = client.get(f"/api/datasets/{dataset_id}/columns")
    assert "Membership_Level" in cols_res.json()
    assert "Customer_Tier" not in cols_res.json()

    # History audit log
    hist_res = client.get(f"/api/datasets/{dataset_id}/history")
    assert hist_res.status_code == 200
    assert len(hist_res.json()) == 3

    # Undo operation
    undo_res = client.post(f"/api/datasets/{dataset_id}/undo")
    assert undo_res.status_code == 200
    assert undo_res.json()["success"] is True
    # Column should be reverted back
    cols_after_undo = client.get(f"/api/datasets/{dataset_id}/columns").json()
    assert "Customer_Tier" in cols_after_undo

    # Reset to original
    reset_res = client.post(f"/api/datasets/{dataset_id}/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["rows"] == initial_rows

def test_analytics_and_statistics():
    demo_res = client.post("/api/datasets/demo").json()
    dataset_id = demo_res["dataset_id"]

    stat_res = client.get(f"/api/datasets/{dataset_id}/statistics")
    assert stat_res.status_code == 200
    stat = stat_res.json()
    assert len(stat["numerical_summaries"]) > 0
    assert len(stat["categorical_summaries"]) > 0

    # Test correlation
    corr_res = client.get(f"/api/datasets/{dataset_id}/correlation")
    assert corr_res.status_code == 200
    corr = corr_res.json()
    assert len(corr["columns"]) >= 2
    assert len(corr["matrix"]) == len(corr["columns"])

    # Test groupby
    grp_res = client.post(
        f"/api/datasets/{dataset_id}/groupby",
        json={"group_column": "Region", "agg_column": "Total_Revenue", "agg_function": "mean"}
    )
    assert grp_res.status_code == 200
    assert len(grp_res.json()["data"]) > 0

    # Test data dictionary
    dict_res = client.get(f"/api/datasets/{dataset_id}/dictionary")
    assert dict_res.status_code == 200
    assert len(dict_res.json()["columns"]) > 0

def test_visualizations():
    demo_res = client.post("/api/datasets/demo").json()
    dataset_id = demo_res["dataset_id"]

    # Bar chart
    v_res = client.post(
        f"/api/datasets/{dataset_id}/visualizations/data",
        json={"chart_type": "bar", "x_column": "Region", "y_column": "Total_Revenue", "aggregation": "mean"}
    )
    assert v_res.status_code == 200
    assert len(v_res.json()["data"]) > 0

    # Histogram
    hist_res = client.post(
        f"/api/datasets/{dataset_id}/visualizations/data",
        json={"chart_type": "histogram", "x_column": "Customer_Age", "bins": 10}
    )
    assert hist_res.status_code == 200
    assert len(hist_res.json()["data"]) == 10

def test_dataset_comparison():
    # Load demo 1
    demo1 = client.post("/api/datasets/demo").json()
    id1 = demo1["dataset_id"]

    # Create dataset 2 with slight changes
    csv_v2 = b"Transaction_ID,Customer_ID,Region,Customer_Tier,Total_Revenue\nTXN-10000,CUST-1000,North,Gold,500.0\nTXN-99999,CUST-9999,West,Bronze,120.0\n"
    up2 = client.post("/api/datasets/upload", files={"file": ("v2.csv", csv_v2, "text/csv")}).json()
    id2 = up2["dataset_id"]

    comp_res = client.post(
        f"/api/datasets/{id1}/compare",
        json={"compare_dataset_id": id2, "key_column": "Transaction_ID"}
    )
    assert comp_res.status_code == 200
    comp = comp_res.json()
    assert "base_rows" in comp["row_count_diff"]
    assert "common_columns" in comp
    assert comp["record_level_diff"] is not None

def test_automated_insights():
    demo_res = client.post("/api/datasets/demo").json()
    dataset_id = demo_res["dataset_id"]

    ins_res = client.get(f"/api/datasets/{dataset_id}/insights")
    assert ins_res.status_code == 200
    ins = ins_res.json()
    assert ins["total_insights"] > 0
    assert len(ins["insights"]) > 0

def test_exports_csv_and_pdf():
    demo_res = client.post("/api/datasets/demo").json()
    dataset_id = demo_res["dataset_id"]

    # Export cleaned CSV
    csv_res = client.get(f"/api/datasets/{dataset_id}/export/csv?type=cleaned")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert len(csv_res.content) > 100

    # Export PDF Report
    pdf_res = client.get(f"/api/datasets/{dataset_id}/export/report")
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers["content-type"]
    assert len(pdf_res.content) > 1000
    # PDF starts with %PDF
    assert pdf_res.content.startswith(b"%PDF")

def test_invalid_dataset_id():
    res = client.get("/api/datasets/non_existent_id_999/metadata")
    assert res.status_code == 404
