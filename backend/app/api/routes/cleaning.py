from typing import List
from fastapi import APIRouter
from app.models.schemas import (
    CleaningOperationRequest, CleaningOperationResponse,
    CleaningHistoryEntry, UndoResponse, ResetResponse
)
from app.services.dataset_manager import dataset_manager
from app.services.data_cleaner import DataCleaner
from app.services.quality_analyzer import QualityAnalyzer

router = APIRouter(prefix="/datasets", tags=["Cleaning Studio"])

@router.post("/{dataset_id}/clean", response_model=CleaningOperationResponse)
def clean_dataset(dataset_id: str, req: CleaningOperationRequest):
    """Execute a transformation operation on the working DataFrame."""
    return DataCleaner.apply_operation(dataset_id, req)

@router.post("/{dataset_id}/undo", response_model=UndoResponse)
def undo_last_operation(dataset_id: str):
    """Revert the most recent cleaning transformation."""
    session = dataset_manager.get_session(dataset_id)
    undone = session.undo()
    qa = QualityAnalyzer.analyze(dataset_id, session.working_df)
    
    if undone:
        msg = f"Reverted operation '{undone.operation}' on {undone.column or 'dataset'}."
    else:
        msg = "No operations to undo. Dataset is already in original state."

    return UndoResponse(
        success=bool(undone),
        message=msg,
        remaining_steps=len(session.history_stack),
        current_rows=len(session.working_df),
        current_columns=len(session.working_df.columns),
        quality_score=qa.overall_score
    )

@router.post("/{dataset_id}/reset", response_model=ResetResponse)
def reset_dataset(dataset_id: str):
    """Reset working dataset to original uploaded CSV state."""
    session = dataset_manager.get_session(dataset_id)
    session.reset_to_original()
    qa = QualityAnalyzer.analyze(dataset_id, session.working_df)
    
    return ResetResponse(
        success=True,
        message="Working dataset reset to original uploaded state.",
        rows=len(session.working_df),
        columns=len(session.working_df.columns),
        quality_score=qa.overall_score
    )

@router.get("/{dataset_id}/history", response_model=List[CleaningHistoryEntry])
def get_cleaning_history(dataset_id: str):
    """Retrieve full chronological audit trail of transformations for active session."""
    session = dataset_manager.get_session(dataset_id)
    return session.cleaning_log
