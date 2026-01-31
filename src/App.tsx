import { useEffect, useCallback, useState } from "react";
import { useBrowserStore } from "@/stores/browserStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { TabBar } from "@/components/TabBar";
import { AddressBar } from "@/components/AddressBar";
import { WebView } from "@/components/WebView";
import { AgentPanel } from "@/components/AgentPanel";
import { ModeToggle } from "@/components/ModeToggle";
import { IllustrationPlaceholder } from "@/components/IllustrationPlaceholder";
import { BookmarksBar } from "@/components/BookmarksBar";
import { HistoryViewer } from "@/components/HistoryViewer";
import { BookmarkManager } from "@/components/BookmarkManager";

function App() {
  const {
    tabs,
    activeTabId,
    isAgentPanelOpen,
    refreshTabs,
    createTab,
    closeTab,
    switchTab,
    toggleAgentPanel,
  } = useBrowserStore();
  const { loadSettings } = useSettingsStore();
  const [showHistory, setShowHistory] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + T: New tab
      if (modKey && e.key === "t" && !e.shiftKey) {
        e.preventDefault();
        createTab();
        return;
      }

      // Cmd/Ctrl + W: Close tab
      if (modKey && e.key === "w" && !e.shiftKey) {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
        return;
      }

      // Cmd/Ctrl + L: Focus address bar
      if (modKey && e.key === "l") {
        e.preventDefault();
        const addressInput = document.querySelector(
          "input[placeholder*='Search or enter']"
        ) as HTMLInputElement;
        addressInput?.focus();
        addressInput?.select();
        return;
      }

      // Cmd/Ctrl + Shift + A: Toggle agent panel
      if (modKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        toggleAgentPanel();
        return;
      }

      // Cmd/Ctrl + H: Show history
      if (modKey && e.key.toLowerCase() === "h" && !e.shiftKey) {
        e.preventDefault();
        setShowHistory(true);
        return;
      }

      // Cmd/Ctrl + B: Show bookmarks
      if (modKey && e.key.toLowerCase() === "b" && !e.shiftKey) {
        e.preventDefault();
        setShowBookmarks(true);
        return;
      }

      // Cmd/Ctrl + [: Previous tab
      if (modKey && e.key === "[") {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        if (currentIndex > 0) {
          switchTab(tabs[currentIndex - 1].id);
        }
        return;
      }

      // Cmd/Ctrl + ]: Next tab
      if (modKey && e.key === "]") {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        if (currentIndex < tabs.length - 1) {
          switchTab(tabs[currentIndex + 1].id);
        }
        return;
      }

      // Cmd/Ctrl + 1-9: Switch to tab by index
      if (modKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const tabIndex = parseInt(e.key, 10) - 1;
        if (tabs[tabIndex]) {
          switchTab(tabs[tabIndex].id);
        }
        return;
      }
    },
    [tabs, activeTabId, createTab, closeTab, switchTab, toggleAgentPanel]
  );

  useEffect(() => {
    // Initialize app
    loadSettings();
    refreshTabs();

    // Create initial tab if none exist
    if (tabs.length === 0) {
      createTab("about:blank");
    }

    // Add keyboard listener
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleKeyDown]);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-cream-50/50">
        {/* Window controls placeholder */}
        <div className="flex items-center gap-1.5 mr-2">
          <div className="w-3 h-3 rounded-full bg-clay-300" />
          <div className="w-3 h-3 rounded-full bg-clay-200" />
        </div>

        {/* Tab Bar */}
        <TabBar />

        {/* Mode Toggle */}
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </header>

      {/* Address Bar */}
      <div className="px-4 py-2 border-b border-border/50 bg-cream-50/30">
        <AddressBar />
      </div>

      {/* Bookmarks Bar */}
      <BookmarksBar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Browser View */}
        <div className="flex-1 relative">
          {tabs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center h-full gradient-warm">
              <IllustrationPlaceholder />
            </div>
          ) : (
            <WebView tab={activeTab} />
          )}
        </div>

        {/* Agent Panel */}
        {isAgentPanelOpen && <AgentPanel />}
      </div>

      {/* History Viewer */}
      <HistoryViewer open={showHistory} onClose={() => setShowHistory(false)} />

      {/* Bookmark Manager */}
      <BookmarkManager
        open={showBookmarks}
        onClose={() => setShowBookmarks(false)}
      />
    </div>
  );
}

export default App;
