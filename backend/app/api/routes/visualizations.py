from fastapi import APIRouter
from app.models.schemas import VisualizationRequest, VisualizationResponse
from app.services.dataset_manager import dataset_manager
from app.services.visualization_service import VisualizationService

router = APIRouter(prefix="/datasets", tags=["Visualizations"])

@router.post("/{dataset_id}/visualizations/data", response_model=VisualizationResponse)
def get_visualization_data(dataset_id: str, req: VisualizationRequest):
    """Dynamically aggregate dataset data for interactive chart rendering."""
    session = dataset_manager.get_session(dataset_id)
    return VisualizationService.generate_chart_data(session.working_df, req)
