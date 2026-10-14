import { API_BASE_URL, apiFetch } from './apiClient';

export interface CsvPreviewRow {
  rowNumber: number;
  data: Record<string, string>;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

export interface CsvPreviewResult {
  entity: string;
  totalRows: number;
  validRowsCount: number;
  duplicateRowsCount: number;
  invalidRowsCount: number;
  previewRows: CsvPreviewRow[];
  canCommit: boolean;
  summaryMessage: string;
}

export interface CsvImportResult {
  success: boolean;
  entity: string;
  totalProcessed: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  hasErrors: boolean;
  errors: Array<{ rowNumber: number; reason: string }>;
  errorReportCsv?: string;
  message: string;
}

export const csvDataService = {
  /**
   * Download official CSV template
   */
  async downloadTemplate(entity: 'customers' | 'branches' | 'franchises' | 'employees'): Promise<void> {
    const token = localStorage.getItem('titan_auth_token');
    const response = await fetch(`${API_BASE_URL}/csv-data/templates/${entity}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Failed to download template: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entity}-template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Export database records to CSV respecting user scope & sanitization
   */
  async exportData(entity: 'customers' | 'branches' | 'franchises' | 'employees'): Promise<void> {
    const token = localStorage.getItem('titan_auth_token');
    const response = await fetch(`${API_BASE_URL}/csv-data/export/${entity}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      let errMsg = response.statusText;
      try {
        const errJson = await response.json();
        errMsg = errJson.message || errMsg;
      } catch {}
      throw new Error(`Export failed: ${errMsg}`);
    }

    const disposition = response.headers.get('content-disposition');
    let filename = `${entity}-export-${new Date().toISOString().slice(0, 10)}.csv`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Preview and validate CSV before committing
   */
  async previewImport(
    entity: 'customers' | 'branches' | 'franchises' | 'employees',
    csvContent: string,
  ): Promise<CsvPreviewResult> {
    const res = await apiFetch<{ success: boolean; data: CsvPreviewResult }>(
      `/csv-data/preview/${entity}`,
      {
        method: 'POST',
        body: JSON.stringify({ csvContent }),
      },
    );
    return res.data || (res as any);
  },

  /**
   * Commit validated CSV import to database
   */
  async executeImport(
    entity: 'customers' | 'branches' | 'franchises' | 'employees',
    csvContent: string,
    skipDuplicates = true,
  ): Promise<CsvImportResult> {
    const res = await apiFetch<{ success: boolean; data: CsvImportResult }>(
      `/csv-data/import/${entity}`,
      {
        method: 'POST',
        body: JSON.stringify({ csvContent, skipDuplicates }),
      },
    );
    return res.data || (res as any);
  },

  /**
   * Download error report CSV
   */
  downloadErrorReport(errorReportCsv: string, entity: string): void {
    const blob = new Blob([errorReportCsv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entity}-import-errors-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
