import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import { Layout } from "./components/layout/Layout";
import { Overview } from "./pages/Overview";
import { Explorer } from "./pages/Explorer";
import { Quality } from "./pages/Quality";
import { CleaningStudio } from "./pages/CleaningStudio";
import { Analytics } from "./pages/Analytics";
import { VisualizationLab } from "./pages/VisualizationLab";
import { Comparison } from "./pages/Comparison";
import { Insights } from "./pages/Insights";
import { Reports } from "./pages/Reports";
import { api } from "./services/api";

export function App() {
  const [datasetId, setDatasetId] = useState(null);
  const [metadata, setMetadata] = useState(null);

  const refreshDataset = async (targetId = null) => {
    const id = targetId || datasetId;
    if (!id) return;
    try {
      const meta = await api.getMetadata(id);
      setMetadata(meta);
      setDatasetId(id);
    } catch (err) {
      console.error("Failed to refresh dataset metadata", err);
    }
  };

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <Layout
                datasetId={datasetId}
                metadata={metadata}
                setMetadata={(meta) => {
                  setMetadata(meta);
                  if (meta) setDatasetId(meta.dataset_id);
                }}
                refreshDataset={refreshDataset}
              />
            }
          >
            <Route path="/" element={<Overview />} />
            <Route path="/overview" element={<Navigate to="/" replace />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/quality" element={<Quality />} />
            <Route path="/cleaning" element={<CleaningStudio />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/visualizations" element={<VisualizationLab />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/about" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
