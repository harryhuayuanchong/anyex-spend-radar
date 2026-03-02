"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import { DocumentCard } from "@/components/inbox/document-card";
import { ExtractionEditor } from "@/components/inbox/extraction-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Document, Category } from "@/lib/types";

export default function InboxPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents/list");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `API returned ${res.status}`);
      } else {
        setDocuments(data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, [fetchDocuments]);

  const filtered =
    statusFilter === "all"
      ? documents
      : documents.filter((d) => d.status === statusFilter);

  const selected = documents.find((d) => d.id === selectedId);

  const handleDeleteRequest = useCallback(
    (id: string) => {
      const doc = documents.find((d) => d.id === id);
      if (doc) setDeleteTarget(doc);
    },
    [documents]
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/documents/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Document deleted");
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    } else {
      toast.error("Failed to delete");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-sm text-gray-500">
          Review extracted data and fix any errors before posting
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="extracted">Extracted</SelectItem>
            <SelectItem value="posted">Posted</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No documents found
              </p>
            ) : (
              filtered.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  selected={doc.id === selectedId}
                  onClick={() => setSelectedId(doc.id)}
                  onDelete={handleDeleteRequest}
                />
              ))
            )}
          </div>

          <div>
            {selected ? (
              <ExtractionEditor
                key={selected.id}
                document={selected}
                categories={categories}
                onSaved={fetchDocuments}
              />
            ) : (
              <div className="rounded-lg border border-dashed bg-white p-12 text-center text-sm text-gray-400">
                Select a document to edit
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Delete Document</DialogTitle>
            <DialogDescription className="text-center">
              This will permanently delete{" "}
              <span className="font-medium text-gray-700">
                {deleteTarget?.filename}
              </span>{" "}
              along with its linked expense and storage file. This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
