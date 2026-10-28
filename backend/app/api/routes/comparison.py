from fastapi import APIRouter
from app.models.schemas import ComparisonRequest, ComparisonResponse
from app.services.comparison_service import ComparisonService

router = APIRouter(prefix="/datasets", tags=["Comparison"])

@router.post("/{dataset_id}/compare", response_model=ComparisonResponse)
def compare_datasets(dataset_id: str, req: ComparisonRequest):
    """Compare active dataset with another dataset session."""
    return ComparisonService.compare(dataset_id, req.compare_dataset_id, req.key_column)
