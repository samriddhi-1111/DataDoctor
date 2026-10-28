const API_BASE = "http://localhost:8001/api";

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      let errorMsg = `Server error: ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData && errorData.detail) {
          errorMsg = Array.isArray(errorData.detail)
            ? errorData.detail.map((e) => e.msg).join(", ")
            : errorData.detail;
        }
      } catch (_) {}
      throw new Error(errorMsg);
    }
    // Return blob if response is PDF or CSV
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/pdf") || contentType.includes("text/csv")) {
      return res.blob();
    }
    return res.json();
  } catch (err) {
    console.error(`API Error on [${options.method || "GET"}] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request("/health"),

  // Datasets
  uploadCsv: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/datasets/upload", {
      method: "POST",
      body: formData,
    });
  },

  loadDemoDataset: () => {
    return request("/datasets/demo", { method: "POST" });
  },

  getMetadata: (datasetId) => {
    return request(`/datasets/${datasetId}/metadata`);
  },

  getColumns: (datasetId) => {
    return request(`/datasets/${datasetId}/columns`);
  },

  getPreview: (datasetId, params = {}) => {
    return request(`/datasets/${datasetId}/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  },

  // Quality
  getQualityAnalysis: (datasetId) => {
    return request(`/datasets/${datasetId}/quality`);
  },

  // Cleaning
  applyCleaning: (datasetId, opData) => {
    return request(`/datasets/${datasetId}/clean`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opData),
    });
  },

  undoCleaning: (datasetId) => {
    return request(`/datasets/${datasetId}/undo`, { method: "POST" });
  },

  resetCleaning: (datasetId) => {
    return request(`/datasets/${datasetId}/reset`, { method: "POST" });
  },

  getCleaningHistory: (datasetId) => {
    return request(`/datasets/${datasetId}/history`);
  },

  // Analytics
  getStatistics: (datasetId) => {
    return request(`/datasets/${datasetId}/statistics`);
  },

  getCorrelations: (datasetId) => {
    return request(`/datasets/${datasetId}/correlation`);
  },

  getGroupBy: (datasetId, groupData) => {
    return request(`/datasets/${datasetId}/groupby`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(groupData),
    });
  },

  getDataDictionary: (datasetId) => {
    return request(`/datasets/${datasetId}/dictionary`);
  },

  // Visualizations
  getVisualizationData: (datasetId, chartConfig) => {
    return request(`/datasets/${datasetId}/visualizations/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chartConfig),
    });
  },

  // Comparison
  compareDatasets: (datasetId, compareDatasetId, keyColumn) => {
    return request(`/datasets/${datasetId}/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compare_dataset_id: compareDatasetId,
        key_column: keyColumn || null,
      }),
    });
  },

  // Insights
  getInsights: (datasetId) => {
    return request(`/datasets/${datasetId}/insights`);
  },

  // Exports
  exportCsvUrl: (datasetId, type = "cleaned") => {
    return `${API_BASE}/datasets/${datasetId}/export/csv?type=${type}`;
  },

  exportPdfUrl: (datasetId) => {
    return `${API_BASE}/datasets/${datasetId}/export/report`;
  },
};
