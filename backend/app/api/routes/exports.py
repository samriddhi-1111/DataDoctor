from fastapi import APIRouter, Query, Response
from fastapi.responses import Response
from app.services.export_service import ExportService
from app.services.report_generator import ReportGenerator

router = APIRouter(prefix="/datasets", tags=["Exports & Reports"])

@router.get("/{dataset_id}/export/csv")
@router.post("/{dataset_id}/export/csv")
def export_csv(dataset_id: str, type: str = Query("cleaned")):
    """Export tabular data or analysis result as a downloadable CSV."""
    csv_content, filename = ExportService.export_csv(dataset_id, type)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{dataset_id}/export/report")
@router.post("/{dataset_id}/export/report")
def export_pdf_report(dataset_id: str):
    """Generate and download a comprehensive PDF audit report."""
    pdf_bytes, filename = ReportGenerator.generate_pdf(dataset_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
