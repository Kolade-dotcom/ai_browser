import { useEffect } from "react";
import { Star } from "lucide-react";
import { useBookmarkStore } from "@/stores/bookmarkStore";
import { useBrowserStore } from "@/stores/browserStore";
import { cn, truncate } from "@/lib/utils";

export function BookmarksBar() {
  const { bookmarks, showBookmarksBar, loadBookmarks } = useBookmarkStore();
  const { createTab } = useBrowserStore();

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  if (!showBookmarksBar || bookmarks.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border/50 bg-cream-50/20 overflow-x-auto scrollbar-thin">
      {bookmarks.slice(0, 10).map((bookmark) => (
        <button
          key={bookmark.id}
          onClick={() => createTab(bookmark.url)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm",
            "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            "transition-colors max-w-[150px]"
          )}
          title={bookmark.url}
        >
          <Star className="w-3.5 h-3.5 text-clay-400 flex-shrink-0" />
          <span className="truncate">{truncate(bookmark.title, 20)}</span>
        </button>
      ))}
      {bookmarks.length > 10 && (
        <button className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
          +{bookmarks.length - 10} more
        </button>
      )}
    </div>
  );
}
