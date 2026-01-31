import { useState, useEffect } from "react";
import { X, Star, Trash2, ExternalLink } from "lucide-react";
import { useBookmarkStore } from "@/stores/bookmarkStore";
import { useBrowserStore } from "@/stores/browserStore";
import * as Dialog from "@radix-ui/react-dialog";

interface BookmarkManagerProps {
  open: boolean;
  onClose: () => void;
}

export function BookmarkManager({ open, onClose }: BookmarkManagerProps) {
  const { bookmarks, loadBookmarks, deleteBookmark } = useBookmarkStore();
  const { createTab } = useBrowserStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      loadBookmarks();
    }
  }, [open, loadBookmarks]);

  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenBookmark = (url: string) => {
    createTab(url);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] bg-card rounded-2xl border border-border shadow-lg z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <Dialog.Title className="text-lg font-medium text-foreground">
                Bookmarks
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {bookmarks.length} bookmarks saved
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </Dialog.Close>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-border">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Bookmarks List */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? "No matching bookmarks found"
                  : "No bookmarks yet. Click the star icon in the address bar to add one."}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-clay-100 flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-clay-600" />
                    </div>
                    <button
                      onClick={() => handleOpenBookmark(bookmark.url)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-sm font-medium text-foreground truncate">
                        {bookmark.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {bookmark.url}
                      </p>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenBookmark(bookmark.url)}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                        title="Open"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBookmark(bookmark.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
