import React, { useState } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  progress: number;
  error?: string;
}

interface FileUploaderProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onFilesChange?: (files: UploadedFile[]) => void;
  label?: string;
  helperText?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  accept = 'image/*,.pdf,.doc,.docx',
  maxSizeMB = 10,
  multiple = true,
  onFilesChange,
  label = 'Upload Vehicle Documents & Photos',
  helperText = 'Drag and drop files here, or click to browse (Max 10MB per file)',
}) => {
  const [filesList, setFilesList] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFiles = (incomingFiles: FileList | File[]) => {
    const newUploads: UploadedFile[] = [];

    Array.from(incomingFiles).forEach((file) => {
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      let errorMsg: string | undefined;

      if (file.size > maxSizeBytes) {
        errorMsg = `File size exceeds ${maxSizeMB}MB limit.`;
      }

      const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      let previewUrl: string | undefined;

      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      const uploadItem: UploadedFile = {
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
        progress: errorMsg ? 0 : 100,
        error: errorMsg,
      };

      newUploads.push(uploadItem);
    });

    const updated = multiple ? [...filesList, ...newUploads] : newUploads;
    setFilesList(updated);
    if (onFilesChange) onFilesChange(updated);
  };

  const removeFile = (id: string) => {
    const updated = filesList.filter((f) => f.id !== id);
    setFilesList(updated);
    if (onFilesChange) onFilesChange(updated);
  };

  return (
    <div className="space-y-3 text-xs">
      <label className="block font-semibold text-zinc-700 uppercase tracking-wider">{label}</label>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors bg-zinc-50/70 cursor-pointer ${
          dragActive
            ? 'border-[#F5A800] bg-amber-50/40'
            : 'border-zinc-200 hover:border-zinc-300'
        }`}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        <Upload className="w-7 h-7 text-[#F5A800] mx-auto mb-2 pointer-events-none" />
        <p className="text-xs font-semibold text-zinc-800">{helperText}</p>
        <p className="text-[10px] text-zinc-500 mt-1 font-mono">Ready for S3 / MinIO backend object storage stream.</p>
      </div>

      {/* Uploaded Files List */}
      <AnimatePresence>
        {filesList.length > 0 && (
          <div className="space-y-2 pt-1">
            {filesList.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 rounded-lg bg-white border border-[#E5E5E5] flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-8 h-8 rounded object-cover border border-zinc-200 shrink-0"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-zinc-400 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-900 truncate">{item.name}</p>
                    <p className="text-[10px] font-mono text-zinc-500">
                      {(item.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    {item.error ? (
                      <span className="text-[10px] text-rose-600 font-medium flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" /> {item.error}
                      </span>
                    ) : (
                      <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-[#F5A800] h-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

