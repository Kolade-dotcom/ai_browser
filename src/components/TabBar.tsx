import { Plus, X } from "lucide-react";
import { useBrowserStore } from "@/stores/browserStore";
import { cn, truncate } from "@/lib/utils";

export function TabBar() {
  const { tabs, createTab, closeTab, switchTab } = useBrowserStore();

  return (
    <div className="flex items-center gap-1 flex-1 overflow-hidden">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin flex-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={cn(
              "group flex items-center gap-2 px-3 py-1.5 min-w-[120px] max-w-[200px] rounded-lg cursor-pointer transition-all",
              "border border-transparent hover:border-border/50",
              tab.is_active
                ? "bg-background shadow-sm border-border"
                : "bg-transparent hover:bg-secondary/50"
            )}
          >
            {/* Favicon */}
            {tab.favicon ? (
              <img
                src={tab.favicon}
                alt=""
                className="w-4 h-4 rounded-sm flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-clay-200 flex-shrink-0" />
            )}

            {/* Title */}
            <span className="text-sm truncate flex-1 text-foreground">
              {tab.title === "New Tab" && !tab.url
                ? "New Tab"
                : truncate(tab.title || "Loading...", 20)}
            </span>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className={cn(
                "opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-secondary transition-all",
                "focus:opacity-100 focus:outline-none"
              )}
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>

      {/* New Tab button */}
      <button
        onClick={() => createTab()}
        className="p-1.5 rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
        title="New Tab"
      >
        <Plus className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
