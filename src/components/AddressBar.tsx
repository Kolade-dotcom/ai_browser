import { useState, useEffect, KeyboardEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Lock,
  Sparkles,
  Star,
  Search,
  Clock,
  Globe,
} from "lucide-react";
import { useBrowserStore } from "@/stores/browserStore";
import { useBookmarkStore } from "@/stores/bookmarkStore";
import { formatUrl, cn } from "@/lib/utils";
import type { HistoryEntry } from "@/types";
import { invoke } from "@tauri-apps/api/core";

interface Suggestion {
  type: "history" | "bookmark" | "search";
  url: string;
  title?: string;
  icon?: React.ReactNode;
}

export function AddressBar() {
  const {
    activeTabId,
    tabs,
    navigateTab,
    viewMode,
    setViewMode,
    goBack,
    goForward,
    refreshTab,
    canGoBack,
    canGoForward,
  } = useBrowserStore();
  const { bookmarks, addBookmark } = useBookmarkStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const isBookmarked = bookmarks.some((b) => b.url === activeTab?.url);

  // Load history on mount
  useEffect(() => {
    invoke<HistoryEntry[]>("get_history").then(setHistory).catch(console.error);
  }, []);

  // Update suggestions when input changes
  useEffect(() => {
    if (!inputValue.trim() || !isFocused) {
      setSuggestions([]);
      return;
    }

    const query = inputValue.toLowerCase();
    const newSuggestions: Suggestion[] = [];

    // Add bookmark suggestions
    bookmarks
      .filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query)
      )
      .slice(0, 3)
      .forEach((b) =>
        newSuggestions.push({
          type: "bookmark",
          url: b.url,
          title: b.title,
          icon: <Star className="w-4 h-4 text-clay-400" />,
        })
      );

    // Add history suggestions
    history
      .filter(
        (h) =>
          (h.title?.toLowerCase().includes(query) ||
            h.url.toLowerCase().includes(query)) &&
          !bookmarks.some((b) => b.url === h.url)
      )
      .slice(0, 3)
      .forEach((h) =>
        newSuggestions.push({
          type: "history",
          url: h.url,
          title: h.title,
          icon: <Clock className="w-4 h-4 text-muted-foreground" />,
        })
      );

    // Add search suggestion
    if (!inputValue.includes(".")) {
      newSuggestions.push({
        type: "search",
        url: `https://google.com/search?q=${encodeURIComponent(inputValue)}`,
        title: `Search for "${inputValue}"`,
        icon: <Search className="w-4 h-4 text-primary" />,
      });
    }

    setSuggestions(newSuggestions);
    setSelectedIndex(-1);
  }, [inputValue, history, bookmarks, isFocused]);

  // Update input when tab changes
  useEffect(() => {
    if (activeTab) {
      setInputValue(activeTab.url === "about:blank" ? "" : activeTab.url);
    }
  }, [activeTab]);

  const handleBookmark = () => {
    if (activeTab?.url && activeTab.url !== "about:blank") {
      addBookmark(activeTab.url, activeTab.title || activeTab.url);
    }
  };

  const handleSubmit = () => {
    if (!inputValue.trim() || !activeTabId) return;

    const url = formatUrl(inputValue.trim());
    navigateTab(activeTabId, url);
    setIsFocused(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setIsFocused(false);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    if (!activeTabId) return;
    navigateTab(activeTabId, suggestion.url);
    setInputValue(suggestion.url);
    setIsFocused(false);
    setSuggestions([]);
  };

  const handleInputBlur = () => {
    // Delay to allow click on suggestion to register
    setTimeout(() => {
      setIsFocused(false);
      setSuggestions([]);
    }, 150);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Navigation buttons */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => activeTabId && goBack(activeTabId)}
          disabled={!activeTabId || !canGoBack(activeTabId)}
          className={cn(
            "p-2 rounded-full transition-colors",
            canGoBack(activeTabId || "")
              ? "hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
              : "text-muted-foreground/30 cursor-not-allowed"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => activeTabId && goForward(activeTabId)}
          disabled={!activeTabId || !canGoForward(activeTabId)}
          className={cn(
            "p-2 rounded-full transition-colors",
            canGoForward(activeTabId || "")
              ? "hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
              : "text-muted-foreground/30 cursor-not-allowed"
          )}
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => activeTabId && refreshTab(activeTabId)}
          disabled={!activeTabId}
          className="p-2 rounded-full hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Address input with suggestions */}
      <div className="flex-1 relative">
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
            "bg-background/80 backdrop-blur-sm",
            isFocused
              ? "border-primary ring-2 ring-primary/20"
              : "border-border/50 hover:border-border"
          )}
        >
          {/* Security icon */}
          <Lock className="w-3.5 h-3.5 text-sage-500" />

          {/* URL Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder="Search or enter address"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          {/* AI suggestion indicator */}
          {viewMode === "agent" && (
            <Sparkles className="w-4 h-4 text-primary animate-pulse-soft" />
          )}
        </div>

        {/* Suggestions dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-card/95 backdrop-blur-md rounded-2xl border border-border/50 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.url}`}
                onClick={() => handleSelectSuggestion(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  index === selectedIndex && "bg-secondary/80"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0">
                  {suggestion.icon || (
                    <Globe className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {suggestion.title || suggestion.url}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {suggestion.type === "search"
                      ? "Google Search"
                      : suggestion.url}
                  </p>
                </div>
                {index === selectedIndex && (
                  <span className="text-xs text-muted-foreground">Enter ↵</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bookmark button */}
      <button
        onClick={handleBookmark}
        disabled={
          !activeTabId || !activeTab?.url || activeTab?.url === "about:blank"
        }
        className={cn(
          "p-2 rounded-full transition-colors",
          isBookmarked
            ? "text-clay-500 hover:text-clay-600"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/80",
          "disabled:opacity-30 disabled:cursor-not-allowed"
        )}
        title={isBookmarked ? "Bookmarked" : "Add bookmark"}
      >
        <Star className={cn("w-4 h-4", isBookmarked && "fill-current")} />
      </button>

      {/* Agent mode button */}
      <button
        onClick={() => setViewMode(viewMode === "agent" ? "normal" : "agent")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
          viewMode === "agent"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
      >
        <Sparkles className="w-4 h-4" />
        <span>{viewMode === "agent" ? "Agent" : "Ask AI"}</span>
      </button>
    </div>
  );
}
