import { useState, useEffect } from "react";
import { X, Search, Clock, Trash2, ExternalLink } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useBrowserStore } from "@/stores/browserStore";
import { truncate } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import type { HistoryEntry } from "@/types";

interface HistoryViewerProps {
  open: boolean;
  onClose: () => void;
}

export function HistoryViewer({ open, onClose }: HistoryViewerProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { createTab } = useBrowserStore();

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  const loadHistory = async () => {
    try {
      const data = await invoke<HistoryEntry[]>("get_history");
      setHistory(data);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  const clearHistory = async () => {
    try {
      await invoke("clear_history");
      setHistory([]);
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  const handleOpenUrl = (url: string) => {
    createTab(url);
    onClose();
  };

  const filteredHistory = history.filter(
    (entry) =>
      entry.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by date
  const groupedHistory = filteredHistory.reduce(
    (groups, entry) => {
      const date = new Date(entry.last_visit).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    },
    {} as Record<string, HistoryEntry[]>
  );

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] bg-card rounded-2xl border border-border shadow-lg z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <Dialog.Title className="text-lg font-medium text-foreground">
                History
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {history.length} items in your browsing history
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearHistory}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                title="Clear history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <Dialog.Close className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </Dialog.Close>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? "No matching history found"
                  : "No browsing history yet"}
              </div>
            ) : (
              Object.entries(groupedHistory).map(([date, entries]) => (
                <div key={date}>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                    {date === new Date().toLocaleDateString() ? "Today" : date}
                  </h4>
                  <div className="space-y-1">
                    {entries.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => handleOpenUrl(entry.url)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/80 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-clay-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-clay-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {entry.title || truncate(entry.url, 50)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {entry.url}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.last_visit).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
