"use client";

import { FileText, Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Document } from "@/lib/types";

const statusConfig: Record<
  Document["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  uploaded: {
    label: "Uploaded",
    variant: "outline",
    icon: <FileText className="h-3 w-3" />,
  },
  processing: {
    label: "Processing",
    variant: "secondary",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  extracted: {
    label: "Extracted",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  posted: {
    label: "Posted",
    variant: "default",
    icon: <Send className="h-3 w-3" />,
  },
  error: {
    label: "Error",
    variant: "destructive",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

interface UploadListProps {
  documents: Document[];
}

export function UploadList({ documents }: UploadListProps) {
  if (documents.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        No documents uploaded yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const cfg = statusConfig[doc.status];
        return (
          <div
            key={doc.id}
            className="flex items-center gap-3 rounded-md border bg-white px-4 py-3"
          >
            <FileText className="h-5 w-5 shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{doc.filename}</p>
              {doc.error_message && (
                <p className="truncate text-xs text-red-500">
                  {doc.error_message}
                </p>
              )}
            </div>
            <Badge variant={cfg.variant} className="flex items-center gap-1">
              {cfg.icon}
              {cfg.label}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
