"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LinkStatus {
  linked: boolean;
  telegram_username: string | null;
  linked_at: string | null;
}

export function TelegramLink() {
  const [status, setStatus] = useState<LinkStatus | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    setLoading(true);
    const res = await fetch("/api/telegram/link");
    if (res.ok) setStatus(await res.json());
    setLoading(false);
  }

  async function generateLink() {
    setGenerating(true);
    const res = await fetch("/api/telegram/link", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setLinkUrl(data.link_url);
    }
    setGenerating(false);
  }

  async function unlinkTelegram() {
    await fetch("/api/telegram/link", { method: "DELETE" });
    setStatus({ linked: false, telegram_username: null, linked_at: null });
    setLinkUrl(null);
  }

  if (loading) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (status?.linked) {
    return (
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">Connected</span>
          {status.telegram_username && (
            <span className="text-sm text-muted-foreground">
              @{status.telegram_username}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Linked at {new Date(status.linked_at!).toLocaleString()}
        </p>
        <Button variant="outline" size="sm" onClick={unlinkTelegram}>
          Unlink
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-sm text-muted-foreground">
        Connect your Telegram to receive payment reminders and query expenses.
      </p>

      {linkUrl ? (
        <div className="space-y-2">
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Open in Telegram
          </a>
          <p className="text-xs text-muted-foreground">
            Click the link above, then press Start in Telegram to complete binding.
          </p>
        </div>
      ) : (
        <Button onClick={generateLink} disabled={generating}>
          {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Link
        </Button>
      )}
    </div>
  );
}
