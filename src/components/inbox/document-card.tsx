"use client";

import { FileText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Document } from "@/lib/types";

const statusVariant: Record<Document["status"], "default" | "secondary" | "destructive" | "outline"> = {
  uploaded: "outline",
  processing: "secondary",
  extracted: "default",
  posted: "default",
  error: "destructive",
};

interface DocumentCardProps {
  document: Document;
  selected: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export function DocumentCard({ document: doc, selected, onClick, onDelete }: DocumentCardProps) {
  const extracted = doc.extracted_json;

  return (
    <div
      onClick={onClick}
      className={`w-full cursor-pointer text-left rounded-lg border p-4 transition-colors hover:bg-gray-50 ${
        selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{doc.filename}</p>
            <Badge variant={statusVariant[doc.status]} className="text-xs">
              {doc.status}
            </Badge>
          </div>
          {extracted && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">{extracted.vendor}</span>
              {" — "}
              {formatCurrency(extracted.amount, extracted.currency)}
              {" — "}
              {formatDate(extracted.date)}
            </div>
          )}
          {doc.error_message && (
            <p className="text-xs text-red-500">{doc.error_message}</p>
          )}
          <p className="text-xs text-gray-400">
            {formatDate(doc.created_at)}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(doc.id);
          }}
          className="shrink-0 rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Delete document"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
