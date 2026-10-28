import io
from datetime import datetime, timezone
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from app.services.dataset_manager import dataset_manager
from app.services.quality_analyzer import QualityAnalyzer
from app.services.statistics_service import StatisticsService
from app.services.insight_engine import InsightEngine

class ReportGenerator:
    @staticmethod
    def generate_pdf(dataset_id: str) -> tuple[bytes, str]:
        session = dataset_manager.get_session(dataset_id)
        df = session.working_df
        metadata = dataset_manager.get_metadata(dataset_id)
        qa = QualityAnalyzer.analyze(dataset_id, df)
        stats = StatisticsService.get_statistics(dataset_id, df)
        insights = InsightEngine.generate_insights(dataset_id)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom palette matching light mode
        c_primary = colors.HexColor("#4F46E5")     # Indigo
        c_dark = colors.HexColor("#172033")        # Deep navy text
        c_muted = colors.HexColor("#64748B")       # Secondary text
        c_border = colors.HexColor("#E2E8F0")      # Table borders
        c_bg_light = colors.HexColor("#F8FAFC")    # Card header bg
        c_accent = colors.HexColor("#0F9F78")      # Green

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=22,
            leading=26,
            textColor=c_primary,
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=c_muted,
            spaceAfter=12
        )
        h1_style = ParagraphStyle(
            "SectionH1",
            parent=styles["Heading2"],
            fontSize=14,
            leading=18,
            textColor=c_dark,
            spaceBefore=14,
            spaceAfter=8
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=c_dark
        )
        small_style = ParagraphStyle(
            "Small",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            textColor=c_muted
        )

        story = []

        # 1. Header Banner
        story.append(Paragraph("DataDoctor — Dataset Health & Quality Audit Report", title_style))
        gen_time = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M:%S UTC")
        story.append(Paragraph(f"Dataset: <b>{session.name}</b> &nbsp;|&nbsp; Generated: <b>{gen_time}</b> &nbsp;|&nbsp; System: DataDoctor v1.0", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=c_primary, spaceBefore=0, spaceAfter=14))

        # 2. Executive Summary Metrics Grid
        story.append(Paragraph("1. Executive Dataset Summary", h1_style))
        
        summary_table_data = [
            [
                Paragraph(f"<b>Total Rows:</b> {metadata.total_rows:,}", body_style),
                Paragraph(f"<b>Total Columns:</b> {metadata.total_columns}", body_style),
                Paragraph(f"<b>Memory Footprint:</b> {metadata.memory_usage_formatted}", body_style),
            ],
            [
                Paragraph(f"<b>Missing Cells:</b> {metadata.missing_cells_total} ({metadata.missing_cells_percentage}%)", body_style),
                Paragraph(f"<b>Duplicate Rows:</b> {metadata.duplicate_rows_count} ({metadata.duplicate_rows_percentage}%)", body_style),
                Paragraph(f"<b>Quality Grade:</b> <b>{qa.severity_label} ({qa.overall_score}/100)</b>", body_style),
            ]
        ]
        summary_table = Table(summary_table_data, colWidths=[180, 180, 180])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
            ('BOX', (0,0), (-1,-1), 1, c_border),
            ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 14))

        # 3. Data Quality Index & Components
        story.append(Paragraph("2. Data Quality Score Breakdown", h1_style))
        comp = qa.components
        quality_table_data = [
            ["Dimension", "Score (0-100)", "Weight", "Weighted Points", "Dimension Status"],
            ["Completeness", f"{comp.completeness:.1f}", "35%", f"{comp.completeness * 0.35:.1f}", "Absence of missing cells across rows/cols"],
            ["Uniqueness", f"{comp.uniqueness:.1f}", "25%", f"{comp.uniqueness * 0.25:.1f}", "Absence of duplicate tuples and redundant rows"],
            ["Validity", f"{comp.validity:.1f}", "25%", f"{comp.validity * 0.25:.1f}", "Absence of extreme outliers and parse anomalies"],
            ["Consistency", f"{comp.consistency:.1f}", "15%", f"{comp.consistency * 0.15:.1f}", "Uniformity of types, casings, and variance"],
            ["Overall Health Score", f"{qa.overall_score:.1f} / 100", "100%", f"{qa.overall_score:.1f}", f"Classification: {qa.severity_label}"]
        ]
        q_table = Table(quality_table_data, colWidths=[110, 80, 60, 90, 200])
        q_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_primary),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('BACKGROUND', (0,1), (-1,-2), colors.white),
            ('BACKGROUND', (0,-1), (-1,-1), c_bg_light),
            ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('ALIGN', (1,0), (3,-1), 'CENTER'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(q_table)
        story.append(Spacer(1, 14))

        # 4. Critical Quality Issues Detected
        story.append(Paragraph("3. Detected Quality Diagnostics & Warnings", h1_style))
        if qa.issues:
            issues_data = [["Severity", "Column", "Issue Title", "Description & Suggested Remediation"]]
            for issue in qa.issues[:8]:  # Show top 8
                issues_data.append([
                    issue.severity.upper(),
                    issue.column or "Dataset-Wide",
                    Paragraph(f"<b>{issue.title}</b>", body_style),
                    Paragraph(f"{issue.description} <i>Suggestion: {issue.suggested_action}</i>", small_style)
                ])
            iss_table = Table(issues_data, colWidths=[65, 85, 130, 260])
            iss_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), c_dark),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('GRID', (0,0), (-1,-1), 0.5, c_border),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(iss_table)
        else:
            story.append(Paragraph("<i>No significant data quality issues detected. All quality tests passed cleanly.</i>", body_style))
        story.append(Spacer(1, 14))

        # 5. Numerical Column Statistics
        if stats.numerical_summaries:
            story.append(Paragraph("4. Key Numerical Column Profiles", h1_style))
            num_data = [["Column", "Mean", "Std Dev", "Min", "Median", "Max", "IQR", "Skew"]]
            for num in stats.numerical_summaries[:8]:
                num_data.append([
                    num.column[:15],
                    f"{num.mean:.2f}" if num.mean is not None else "-",
                    f"{num.std:.2f}" if num.std is not None else "-",
                    f"{num.min:.2f}" if num.min is not None else "-",
                    f"{num.median:.2f}" if num.median is not None else "-",
                    f"{num.max:.2f}" if num.max is not None else "-",
                    f"{num.iqr:.2f}" if num.iqr is not None else "-",
                    f"{num.skewness:.2f}" if num.skewness is not None else "-",
                ])
            num_table = Table(num_data, colWidths=[100, 60, 60, 60, 65, 65, 65, 65])
            num_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), c_bg_light),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('GRID', (0,0), (-1,-1), 0.5, c_border),
                ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(num_table)
            story.append(Spacer(1, 14))

        # 6. Automated Insights & Anomalies
        story.append(Paragraph("5. Analytical Insights & Patterns", h1_style))
        if insights.insights:
            for ins in insights.insights[:5]:
                story.append(Paragraph(
                    f"• <b>[{ins.category.upper()}] {ins.title}</b>: {ins.explanation} "
                    f"<i>(Recommended: {ins.suggested_action})</i>", body_style
                ))
                story.append(Spacer(1, 4))
        else:
            story.append(Paragraph("<i>No abnormal patterns or skewed distributions detected.</i>", body_style))
        story.append(Spacer(1, 14))

        # 7. Cleaning Operations History Log
        story.append(Paragraph("6. Cleaning Audit Trail", h1_style))
        if session.cleaning_log:
            clean_data = [["Step", "Timestamp", "Operation", "Target Column", "Rows Affected", "Status"]]
            for log in session.cleaning_log:
                clean_data.append([
                    str(log.step_id),
                    log.timestamp,
                    log.operation,
                    log.column or "Dataset-Wide",
                    str(log.affected_rows),
                    log.status.upper()
                ])
            c_table = Table(clean_data, colWidths=[35, 80, 130, 115, 80, 100])
            c_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), c_bg_light),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('GRID', (0,0), (-1,-1), 0.5, c_border),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(c_table)
        else:
            story.append(Paragraph("<i>No data cleaning transformations performed in this session. Original dataset preserved.</i>", body_style))
        story.append(Spacer(1, 14))

        # 8. Methodology Note
        story.append(Paragraph("7. Algorithmic Methodology", h1_style))
        methodology_text = (
            "DataDoctor calculates the Data Quality Score using a weighted multi-criteria model: "
            "Completeness (35%) penalizes missing cells; Uniqueness (25%) penalizes duplicate rows; "
            "Validity (25%) quantifies 1.5x IQR statistical outlier boundary exceedances; "
            "Consistency (15%) identifies zero-variance constant columns and category casing discrepancies. "
            "All metrics are calculated directly via NumPy and Pandas algorithms without external API calls."
        )
        story.append(Paragraph(methodology_text, small_style))

        # Build PDF
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        filename = f"DataDoctor_Audit_Report_{session.dataset_id}.pdf"
        return pdf_bytes, filename
