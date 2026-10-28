import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { UploadModal } from "../upload/UploadDropzone";
import { ConfirmationModal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { api } from "../../services/api";

export function Layout({ datasetId, metadata, setMetadata, refreshDataset }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleDemoLoad = async () => {
    setIsLoading(true);
    try {
      const data = await api.loadDemoDataset();
      setMetadata(data);
      showToast("Loaded Synthetic Retail Sales demo dataset successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to load demo dataset", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!datasetId) return;
    setIsLoading(true);
    try {
      const res = await api.undoCleaning(datasetId);
      if (res.success) {
        showToast(res.message, "success");
        await refreshDataset();
      } else {
        showToast(res.message, "info");
      }
    } catch (err) {
      showToast(err.message || "Failed to undo operation", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetConfirm = async () => {
    if (!datasetId) return;
    setIsLoading(true);
    try {
      const res = await api.resetCleaning(datasetId);
      showToast(res.message, "success");
      setIsResetConfirmOpen(false);
      await refreshDataset();
    } catch (err) {
      showToast(err.message || "Failed to reset dataset", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col md:pl-64">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        closeMobile={() => setIsMobileOpen(false)}
      />

      {/* Header */}
      <Header
        metadata={metadata}
        onOpenMobile={() => setIsMobileOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onLoadDemo={handleDemoLoad}
        onUndo={handleUndo}
        onReset={() => setIsResetConfirmOpen(true)}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <Outlet context={{ datasetId, metadata, refreshDataset, handleDemoLoad }} />
      </main>

      {/* Upload CSV Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={(newMeta) => {
          setMetadata(newMeta);
          setIsUploadOpen(false);
          showToast(`Uploaded ${newMeta.name} successfully!`, "success");
        }}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title="Reset to Original Dataset?"
        message="This action will discard all transformations, imputations, and filters performed in this session and restore the original uploaded CSV file."
        confirmLabel="Reset Dataset"
        confirmVariant="danger"
        isLoading={isLoading}
        onConfirm={handleResetConfirm}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
}
