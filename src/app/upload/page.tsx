"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Inbox } from "lucide-react";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { UploadList } from "@/components/upload/upload-list";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Document } from "@/lib/types";

const SOURCE_TYPES = [
  { value: "invoice", label: "Invoice" },
  { value: "receipt", label: "Receipt" },
  { value: "bill", label: "Bill" },
  { value: "statement", label: "Statement" },
  { value: "other", label: "Other" },
];

export default function UploadPage() {
  const [sourceType, setSourceType] = useState("invoice");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for processing documents
  useEffect(() => {
    const processingIds = documents
      .filter((d) => d.status === "processing")
      .map((d) => d.id);

    if (processingIds.length === 0) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(async () => {
      for (const id of processingIds) {
        const res = await fetch(`/api/documents/${id}`);
        if (!res.ok) continue;
        const updated: Document = await res.json();
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? updated : d))
        );
        if (updated.status === "posted") {
          toast.success(`${updated.filename} processed & posted`);
        } else if (updated.status === "extracted") {
          toast.success(`${updated.filename} extracted — review in Inbox`);
        } else if (updated.status === "error") {
          toast.error(`${updated.filename}: ${updated.error_message}`);
        }
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [documents]);

  const handleFiles = useCallback(
    async (files: File[]) => {
      setUploading(true);
      for (const file of files) {
        try {
          const form = new FormData();
          form.append("file", file);
          form.append("source_type", sourceType);

          const res = await fetch("/api/documents/upload", {
            method: "POST",
            body: form,
          });

          if (!res.ok) {
            const err = await res.json();
            toast.error(`Upload failed: ${err.error}`);
            continue;
          }

          const doc: Document = await res.json();
          setDocuments((prev) => [doc, ...prev]);
          toast.success(`Uploaded ${file.name}`);

          // Auto-trigger processing
          fetch(`/api/documents/${doc.id}/process`, { method: "POST" });
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === doc.id ? { ...d, status: "processing" } : d
            )
          );
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      setUploading(false);
    },
    [sourceType]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Center</h1>
        <p className="text-sm text-gray-500">
          Upload invoices, receipts, and bills for automatic extraction
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Document type:</span>
        <Select value={sourceType} onValueChange={setSourceType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <FileDropzone onFiles={handleFiles} />

      {uploading && (
        <p className="text-center text-sm text-gray-500">Uploading...</p>
      )}

      <UploadList documents={documents} />

      {documents.length > 0 &&
        documents.every((d) => d.status !== "processing" && d.status !== "uploaded") && (
          <Link href="/inbox">
            <div className="group flex items-center gap-4 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5 transition-all hover:border-green-300 hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900">
                  All {documents.length} document{documents.length > 1 ? "s" : ""} processed
                </p>
                <p className="text-xs text-green-600">
                  Review and manage your documents in the Inbox
                </p>
              </div>
              <Button
                variant="outline"
                className="border-green-300 bg-white text-green-700 hover:bg-green-50 hover:text-green-800"
              >
                <Inbox className="mr-2 h-4 w-4" />
                Go to Inbox
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </Link>
        )}
    </div>
  );
}
