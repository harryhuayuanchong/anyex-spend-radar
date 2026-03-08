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
        "flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 sm:p-10 transition-colors",
        dragOver
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50"
          : "border-border hover:border-muted-foreground/50"
      )}
    >
      <Upload className="h-8 w-8 text-muted-foreground" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Drop files here or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, PNG, JPG, JPEG — invoices, receipts, bills
        </p>
      </div>
      <div className="flex gap-2 text-xs text-muted-foreground">
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
