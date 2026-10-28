from fastapi import APIRouter
from app.models.schemas import (
    StatisticsResponse, CorrelationResponse, GroupByRequest, GroupByResponse, DictionaryResponse
)
from app.services.dataset_manager import dataset_manager
from app.services.statistics_service import StatisticsService

router = APIRouter(prefix="/datasets", tags=["Analytics & Statistics"])

@router.get("/{dataset_id}/statistics", response_model=StatisticsResponse)
def get_statistics(dataset_id: str):
    """Compute detailed numerical, categorical, and date distributions."""
    session = dataset_manager.get_session(dataset_id)
    return StatisticsService.get_statistics(dataset_id, session.working_df)

@router.get("/{dataset_id}/correlation", response_model=CorrelationResponse)
def get_correlations(dataset_id: str):
    """Compute Pearson correlation matrix and identify significant collinearties."""
    session = dataset_manager.get_session(dataset_id)
    return StatisticsService.get_correlations(session.working_df)

@router.post("/{dataset_id}/groupby", response_model=GroupByResponse)
def perform_groupby(dataset_id: str, req: GroupByRequest):
    """Group by categorical attribute and aggregate numeric metric."""
    session = dataset_manager.get_session(dataset_id)
    return StatisticsService.perform_groupby(session.working_df, req.group_column, req.agg_column, req.agg_function)

@router.get("/{dataset_id}/dictionary", response_model=DictionaryResponse)
def get_dictionary(dataset_id: str):
    """Generate dynamic rule-based data dictionary for active dataset."""
    session = dataset_manager.get_session(dataset_id)
    return StatisticsService.get_data_dictionary(dataset_id, session.working_df)
