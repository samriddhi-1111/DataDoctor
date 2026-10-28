"""
DataDoctor — Optional Tkinter Desktop Companion
Demonstrates Python Desktop GUI with Tkinter, Matplotlib integration,
and direct reuse of DataDoctor's core analytical algorithms.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import pandas as pd
import numpy as np

# Matplotlib Tkinter Canvas Integration
import matplotlib
matplotlib.use("TkAgg")
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg

from app.services.quality_analyzer import QualityAnalyzer
from app.services.statistics_service import StatisticsService
from app.utils.dataframe_utils import infer_column_type

class DataDoctorDesktopApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("DataDoctor Desktop — Dataset Health Diagnostic Tool")
        self.root.geometry("900x650")
        self.root.minsize(800, 550)

        self.df: pd.DataFrame | None = None
        self.filepath: str | None = None

        self._build_ui()

    def _build_ui(self):
        # Configure styles
        style = ttk.Style()
        style.theme_use("clam")

        # Top Header Frame
        header = ttk.Frame(self.root, padding=12)
        header.pack(fill="x", side="top")

        title_lbl = ttk.Label(
            header,
            text="DataDoctor Desktop Companion",
            font=("Helvetica", 16, "bold"),
            foreground="#4F46E5"
        )
        title_lbl.pack(side="left")

        btn_load = ttk.Button(header, text="Open CSV File...", command=self.load_csv)
        btn_load.pack(side="right", padx=5)

        # Main Split Content
        main_paned = ttk.PanedWindow(self.root, orient="horizontal")
        main_paned.pack(fill="both", expand=True, padx=10, pady=10)

        # Left Control & Metrics Panel
        left_frame = ttk.LabelFrame(main_paned, text="Dataset Diagnostics", padding=10)
        main_paned.add(left_frame, weight=1)

        # Metrics Labels
        self.lbl_file = ttk.Label(left_frame, text="File: No dataset loaded", font=("Helvetica", 10, "italic"))
        self.lbl_file.pack(anchor="w", pady=2)

        self.lbl_dim = ttk.Label(left_frame, text="Dimensions: 0 rows × 0 columns", font=("Helvetica", 10, "bold"))
        self.lbl_dim.pack(anchor="w", pady=2)

        self.lbl_score = ttk.Label(left_frame, text="Quality Score: — / 100", font=("Helvetica", 11, "bold"), foreground="#0F9F78")
        self.lbl_score.pack(anchor="w", pady=4)

        ttk.Separator(left_frame, orient="horizontal").pack(fill="x", pady=8)

        # Action Buttons
        btn_missing = ttk.Button(left_frame, text="Analyze Missing Values", command=self.show_missing_analysis)
        btn_missing.pack(fill="x", pady=4)

        btn_dups = ttk.Button(left_frame, text="Detect Duplicate Records", command=self.show_duplicates)
        btn_dups.pack(fill="x", pady=4)

        btn_stats = ttk.Button(left_frame, text="Summary Statistics Table", command=self.show_statistics)
        btn_stats.pack(fill="x", pady=4)

        # Diagnostic Text Log
        ttk.Label(left_frame, text="Diagnostic Output Log:").pack(anchor="w", pady=(10, 2))
        self.txt_log = tk.Text(left_frame, height=12, width=35, font=("Consolas", 9), relief="solid", bd=1)
        self.txt_log.pack(fill="both", expand=True, pady=4)

        # Right Chart Frame
        self.right_frame = ttk.LabelFrame(main_paned, text="Matplotlib Visual Inspection", padding=10)
        main_paned.add(self.right_frame, weight=2)

        # Embedded Matplotlib Figure
        self.fig = Figure(figsize=(5, 4), dpi=100)
        self.ax = self.fig.add_subplot(111)
        self.ax.set_title("Load a CSV dataset to visualize distributions", fontsize=10)

        self.canvas = FigureCanvasTkAgg(self.fig, master=self.right_frame)
        self.canvas.draw()
        self.canvas.get_tk_widget().pack(fill="both", expand=True)

    def load_csv(self):
        filetypes = [("CSV Files", "*.csv"), ("All Files", "*.*")]
        path = filedialog.askopenfilename(title="Select Dataset CSV", filetypes=filetypes)
        if not path:
            return

        try:
            self.df = pd.read_csv(path)
            self.filepath = path
            filename = Path(path).name

            self.lbl_file.config(text=f"File: {filename}")
            self.lbl_dim.config(text=f"Dimensions: {len(self.df):,} rows × {len(self.df.columns)} columns")

            # Run Quality Analyzer
            qa = QualityAnalyzer.analyze("desktop_session", self.df)
            self.lbl_score.config(text=f"Quality Score: {qa.overall_score}/100 ({qa.severity_label})")

            self.log(f"Loaded '{filename}' with {len(self.df)} rows and {len(self.df.columns)} columns.")
            self.log(f"Quality Grade: {qa.severity_label} ({qa.overall_score}/100)")
            self.log(f"Completeness: {qa.components.completeness}% | Uniqueness: {qa.components.uniqueness}%")

            # Render initial missing values chart
            self.plot_missing_chart(qa)
            messagebox.showinfo("Success", f"Successfully loaded {filename}!\nQuality Score: {qa.overall_score}/100")
        except Exception as e:
            messagebox.showerror("Error Reading File", str(e))

    def show_missing_analysis(self):
        if self.df is None:
            messagebox.showwarning("Warning", "Please load a CSV dataset first.")
            return

        qa = QualityAnalyzer.analyze("desktop_session", self.df)
        self.log("\n--- MISSING VALUE ANALYSIS ---")
        for m in qa.missing_by_column:
            if m["missing_count"] > 0:
                self.log(f"• {m['column']}: {m['missing_count']} missing ({m['missing_percentage']}%)")
        self.plot_missing_chart(qa)

    def show_duplicates(self):
        if self.df is None:
            messagebox.showwarning("Warning", "Please load a CSV dataset first.")
            return

        dups = int(self.df.duplicated().sum())
        pct = (dups / len(self.df)) * 100
        self.log(f"\n--- DUPLICATE ROW CHECK ---")
        self.log(f"Total duplicate rows: {dups} ({pct:.2f}%)")
        messagebox.showinfo("Duplicate Check", f"Found {dups} duplicate records ({pct:.2f}% of dataset).")

    def show_statistics(self):
        if self.df is None:
            messagebox.showwarning("Warning", "Please load a CSV dataset first.")
            return

        stats = StatisticsService.get_statistics("desktop_session", self.df)
        self.log("\n--- NUMERICAL STATISTICS ---")
        for s in stats.numerical_summaries:
            self.log(f"[{s.column}] Mean: {s.mean}, Median: {s.median}, Std: {s.std}, Range: [{s.min}, {s.max}]")

        # Plot first numeric column histogram
        if stats.numerical_summaries:
            first_num = stats.numerical_summaries[0].column
            self.ax.clear()
            self.df[first_num].dropna().plot(kind="hist", bins=20, ax=self.ax, color="#4F46E5", edgecolor="white")
            self.ax.set_title(f"Histogram: {first_num}", fontsize=10, fontweight="bold")
            self.ax.set_xlabel(first_num, fontsize=9)
            self.canvas.draw()

    def plot_missing_chart(self, qa):
        self.ax.clear()
        missing = [m for m in qa.missing_by_column if m["missing_count"] > 0]
        if missing:
            cols = [m["column"] for m in missing]
            counts = [m["missing_count"] for m in missing]
            self.ax.bar(cols, counts, color="#DC4C64")
            self.ax.set_title("Missing Values by Column", fontsize=10, fontweight="bold")
            self.ax.tick_params(axis='x', rotation=30, labelsize=8)
        else:
            self.ax.text(0.5, 0.5, "Zero Missing Values!", ha="center", va="center", color="#0F9F78", fontsize=12, fontweight="bold")
            self.ax.set_title("Completeness Audit", fontsize=10)
        self.fig.tight_layout()
        self.canvas.draw()

    def log(self, text: str):
        self.txt_log.insert("end", text + "\n")
        self.txt_log.see("end")

if __name__ == "__main__":
    root = tk.Tk()
    app = DataDoctorDesktopApp(root)
    root.mainloop()
