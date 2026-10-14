import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
} from 'lucide-react';
import {
  csvDataService,
  CsvPreviewResult,
  CsvImportResult,
} from '@/services/csv-data.service';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: 'customers' | 'branches' | 'franchises' | 'employees';
  title?: string;
  onImportComplete?: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  entity,
  title,
  onImportComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [csvContent, setCsvContent] = useState<string>('');
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [previewResult, setPreviewResult] = useState<CsvPreviewResult | null>(null);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);

  if (!isOpen) return null;

  const entityLabels: Record<string, string> = {
    customers: 'Customers',
    branches: 'Dealership Branches',
    franchises: 'Franchise Hubs',
    employees: 'Staff & Personnel',
  };

  const currentTitle = title || `Import ${entityLabels[entity] || entity} (CSV)`;

  const handleDownloadTemplate = async () => {
    try {
      await csvDataService.downloadTemplate(entity);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to download template');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Please select a valid .csv file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File exceeds maximum limit of 5MB.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content || !content.trim()) {
        setErrorMessage('The selected CSV file is empty.');
        return;
      }
      setCsvContent(content);
      await runPreview(content);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const runPreview = async (content: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const preview = await csvDataService.previewImport(entity, content);
      setPreviewResult(preview);
      setStep('preview');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse and validate CSV.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!csvContent) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await csvDataService.executeImport(entity, csvContent, skipDuplicates);
      setImportResult(result);
      setStep('result');
      if (onImportComplete && result.importedCount > 0) {
        onImportComplete();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to execute import.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setFileName('');
    setCsvContent('');
    setPreviewResult(null);
    setImportResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111111] border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-500" />
              {currentTitle}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Bulk data ingestion with validation, duplicate detection, and tenant scoping
            </p>
          </div>
          <button
            id="btn-close-modal"
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/80 rounded-lg text-xs text-red-200 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-200">
                      Standard {entityLabels[entity] || entity} CSV Template
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Ensure columns match official layout to avoid import rejection
                    </p>
                  </div>
                </div>
                <button
                  id="btn-download-template"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold rounded-lg border border-zinc-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" /> Download Template
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                id="csv-dropzone"
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-amber-500/60 rounded-xl p-8 text-center cursor-pointer transition-colors bg-zinc-900/20 hover:bg-zinc-900/40"
              >
                <input
                  id="csv-file-input"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
                  {loading ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <p className="text-sm font-semibold text-zinc-200">
                  {loading ? 'Validating CSV...' : 'Click to select or drop CSV file'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Supports UTF-8 CSV files up to 5MB (max 500 rows per batch)
                </p>
              </div>

              <div className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800/80 text-xs text-zinc-400 space-y-1.5">
                <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Safety & Business Rules:
                </div>
                <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
                  {entity === 'franchises' && (
                    <li>Only Super Admin is authorized to import and create franchise hubs.</li>
                  )}
                  {entity === 'branches' && (
                    <li>Branches must reference an existing valid franchise code. Super Admin only.</li>
                  )}
                  {entity === 'employees' && (
                    <>
                      <li>Employees will be imported in PENDING approval status.</li>
                      <li>Assigning SUPER_ADMIN role via CSV is prohibited.</li>
                      <li>Role rank cannot exceed creator authorization level.</li>
                    </>
                  )}
                  {entity === 'customers' && (
                    <>
                      <li>Customer records are created without insecure auto-generated passwords.</li>
                      <li>Phone number and email deduplication is strictly enforced.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & ROW VALIDATION */}
          {step === 'preview' && previewResult && (
            <div className="space-y-4">
              {/* Summary Metrics */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-lg">
                  <div className="text-[11px] text-zinc-400 font-medium">Total Rows</div>
                  <div className="text-lg font-bold text-white mt-0.5">{previewResult.totalRows}</div>
                </div>
                <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg">
                  <div className="text-[11px] text-emerald-400 font-medium">Valid Rows</div>
                  <div className="text-lg font-bold text-emerald-300 mt-0.5">{previewResult.validRowsCount}</div>
                </div>
                <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg">
                  <div className="text-[11px] text-amber-400 font-medium">Duplicates</div>
                  <div className="text-lg font-bold text-amber-300 mt-0.5">{previewResult.duplicateRowsCount}</div>
                </div>
                <div className="p-3 bg-red-950/20 border border-red-800/40 rounded-lg">
                  <div className="text-[11px] text-red-400 font-medium">Invalid / Errors</div>
                  <div className="text-lg font-bold text-red-300 mt-0.5">{previewResult.invalidRowsCount}</div>
                </div>
              </div>

              {/* Duplicate Handling Policy */}
              {previewResult.duplicateRowsCount > 0 && (
                <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-200 font-medium">
                      {previewResult.duplicateRowsCount} duplicate record(s) detected.
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-200">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-zinc-800"
                    />
                    <span>Skip duplicates and continue</span>
                  </label>
                </div>
              )}

              {/* Rows Preview Table */}
              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-900/80 sticky top-0 border-b border-zinc-800 text-zinc-400">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold w-16">Row #</th>
                        <th className="py-2.5 px-3 font-semibold w-24">Status</th>
                        <th className="py-2.5 px-3 font-semibold">Row Data Sample</th>
                        <th className="py-2.5 px-3 font-semibold">Validation Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                      {previewResult.previewRows.map((row) => {
                        let badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                        let label = 'VALID';
                        if (!row.isValid) {
                          badgeClass = 'bg-red-500/10 text-red-400 border-red-500/30';
                          label = 'INVALID';
                        } else if (row.isDuplicate) {
                          badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                          label = 'DUPLICATE';
                        }

                        const dataKeys = Object.keys(row.data).slice(0, 3);
                        const sampleStr = dataKeys
                          .map((k) => `${k}: ${row.data[k]}`)
                          .join(' | ');

                        return (
                          <tr key={row.rowNumber} className="hover:bg-zinc-900/30">
                            <td className="py-2 px-3 font-mono text-zinc-400">{row.rowNumber}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeClass}`}
                              >
                                {label}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono text-zinc-300 max-w-xs truncate" title={sampleStr}>
                              {sampleStr || '—'}
                            </td>
                            <td className="py-2 px-3 text-zinc-400">
                              {row.errors.length > 0 ? (
                                <span className="text-red-400 font-medium">{row.errors.join('; ')}</span>
                              ) : row.isDuplicate ? (
                                <span className="text-amber-400">Already exists in system or file</span>
                              ) : (
                                <span className="text-emerald-400">Passed validation</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RESULT SUMMARY */}
          {step === 'result' && importResult && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Import Batch Completed</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">{importResult.message}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-lg">
                  <div className="text-[11px] text-zinc-400">Successfully Imported</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{importResult.importedCount}</div>
                </div>
                <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-lg">
                  <div className="text-[11px] text-zinc-400">Skipped (Duplicates)</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">{importResult.skippedCount}</div>
                </div>
                <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-lg">
                  <div className="text-[11px] text-zinc-400">Failed Records</div>
                  <div className="text-xl font-bold text-red-400 mt-1">{importResult.failedCount}</div>
                </div>
              </div>

              {/* Download error report if errors exist */}
              {importResult.errorReportCsv && (
                <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-lg max-w-lg mx-auto text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-semibold text-red-300">Detailed Error Report Available</h5>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Download identified failures and reasons for audit
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        csvDataService.downloadErrorReport(importResult.errorReportCsv!, entity)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-800/50 text-red-200 text-xs font-semibold rounded-lg border border-red-700/50 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Errors (.CSV)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div>
            {step === 'preview' && (
              <button
                onClick={handleReset}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline font-medium"
              >
                Choose another file
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors"
            >
              {step === 'result' ? 'Close' : 'Cancel'}
            </button>

            {step === 'preview' && (
              <button
                onClick={handleCommit}
                disabled={loading || !previewResult?.canCommit}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  previewResult?.canCommit
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md hover:shadow-amber-500/20'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Committing...
                  </>
                ) : (
                  <>
                    Commit Import <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
