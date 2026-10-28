from fastapi import APIRouter
from app.models.schemas import QualityAnalysisResponse
from app.services.dataset_manager import dataset_manager
from app.services.quality_analyzer import QualityAnalyzer

router = APIRouter(prefix="/datasets", tags=["Data Quality"])

@router.get("/{dataset_id}/quality", response_model=QualityAnalysisResponse)
def get_quality_analysis(dataset_id: str):
    """Perform real algorithmic quality checks and calculate the 0-100 data quality score."""
    session = dataset_manager.get_session(dataset_id)
    return QualityAnalyzer.analyze(dataset_id, session.working_df)
