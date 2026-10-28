from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, UploadFile, Query, HTTPException, status
from app.models.schemas import DatasetMetadata, PreviewResponse, PreviewRequest
from app.services.dataset_manager import dataset_manager
from app.utils.validation import validate_csv_file

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.post("/upload", response_model=DatasetMetadata)
async def upload_csv(file: UploadFile = File(...)):
    """Upload a CSV dataset and initialize an active analysis session."""
    content = await file.read()
    valid, encoding = validate_csv_file(file, content)
    filename = file.filename or "uploaded_dataset.csv"
    dataset_id = dataset_manager.create_session_from_csv(filename, content, encoding=encoding)
    return dataset_manager.get_metadata(dataset_id)

@router.post("/demo", response_model=DatasetMetadata)
def load_demo():
    """Generates and loads a deterministic synthetic Retail Sales dataset (550+ rows)."""
    dataset_id = dataset_manager.create_demo_dataset()
    return dataset_manager.get_metadata(dataset_id)

@router.get("/{dataset_id}/metadata", response_model=DatasetMetadata)
def get_metadata(dataset_id: str):
    """Retrieve full structural, dimension, and quality summary metadata."""
    return dataset_manager.get_metadata(dataset_id)

@router.get("/{dataset_id}/columns", response_model=List[str])
def get_columns(dataset_id: str):
    """Retrieve column names for active working dataset."""
    session = dataset_manager.get_session(dataset_id)
    return list(session.working_df.columns)

@router.post("/{dataset_id}/preview", response_model=PreviewResponse)
def get_preview_post(dataset_id: str, req: PreviewRequest):
    """Retrieve paginated, searched, sorted, and filtered rows from working dataset."""
    return dataset_manager.get_preview(
        dataset_id=dataset_id,
        page=req.page,
        page_size=req.page_size,
        sort_by=req.sort_by,
        sort_descending=req.sort_descending,
        search=req.search,
        selected_columns=req.columns,
        filters=req.filters
    )

@router.get("/{dataset_id}/preview", response_model=PreviewResponse)
def get_preview_get(
    dataset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=100),
    sort_by: Optional[str] = None,
    sort_desc: bool = False,
    search: Optional[str] = None
):
    """GET variant for table preview."""
    return dataset_manager.get_preview(
        dataset_id=dataset_id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_descending=sort_desc,
        search=search
    )
