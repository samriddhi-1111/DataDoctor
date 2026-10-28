from fastapi import APIRouter
from app.models.schemas import InsightsResponse
from app.services.insight_engine import InsightEngine

router = APIRouter(prefix="/datasets", tags=["Insights & Anomalies"])

@router.get("/{dataset_id}/insights", response_model=InsightsResponse)
def get_insights(dataset_id: str):
    """Run automated insight and anomaly detection on active dataset."""
    return InsightEngine.generate_insights(dataset_id)
