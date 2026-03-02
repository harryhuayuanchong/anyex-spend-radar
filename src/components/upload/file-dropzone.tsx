"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFiles: (files: File[]) => void;
}

export function FileDropzone({ onFiles }: FileDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) onFiles(files);
      e.target.value = "";
    },
    [onFiles]
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors",
        dragOver
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400"
      )}
    >
      <Upload className="h-8 w-8 text-gray-400" />
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">
          Drop files here or click to browse
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF, PNG, JPG, JPEG — invoices, receipts, bills
        </p>
      </div>
      <div className="flex gap-2 text-xs text-gray-400">
        <FileText className="h-4 w-4" /> PDF
        <ImageIcon className="h-4 w-4 ml-2" /> Images
      </div>
      <input
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        multiple
        onChange={handleChange}
      />
    </label>
  );
}
