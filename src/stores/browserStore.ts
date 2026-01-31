import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { buildFaviconUrl } from "@/lib/utils/favicon";
import type { Tab, TabId, ViewMode, HistoryEntry } from "@/types";

interface BrowserStore {
  // State
  tabs: Tab[];
  activeTabId: TabId | null;
  viewMode: ViewMode;
  isAgentPanelOpen: boolean;
  isLoading: boolean;
  history: HistoryEntry[];

  // Tab navigation history (for back/forward)
  tabHistory: Record<TabId, string[]>;
  tabHistoryIndex: Record<TabId, number>;

  // Actions
  createTab: (url?: string) => Promise<void>;
  closeTab: (tabId: TabId) => Promise<void>;
  switchTab: (tabId: TabId) => Promise<void>;
  navigateTab: (tabId: TabId, url: string) => Promise<void>;
  goBack: (tabId: TabId) => Promise<void>;
  goForward: (tabId: TabId) => Promise<void>;
  refreshTab: (tabId: TabId) => Promise<void>;
  canGoBack: (tabId: TabId) => boolean;
  canGoForward: (tabId: TabId) => boolean;
  refreshTabs: () => Promise<void>;
  loadHistory: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  toggleAgentPanel: () => void;
  setAgentPanelOpen: (open: boolean) => void;
}

export const useBrowserStore = create<BrowserStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  viewMode: "normal",
  isAgentPanelOpen: false,
  isLoading: false,
  history: [],
  tabHistory: {},
  tabHistoryIndex: {},

  createTab: async (url) => {
    set({ isLoading: true });
    try {
      const newTab = await invoke<Tab>("create_tab", { url });
      const initialUrl = url || "about:blank";
      set((state) => ({
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
        isLoading: false,
        tabHistory: {
          ...state.tabHistory,
          [newTab.id]: [initialUrl],
        },
        tabHistoryIndex: {
          ...state.tabHistoryIndex,
          [newTab.id]: 0,
        },
      }));
    } catch (error) {
      console.error("Failed to create tab:", error);
      set({ isLoading: false });
    }
  },

  closeTab: async (tabId) => {
    try {
      await invoke("close_tab", { tabId });
      const { tabs, activeTabId } = get();
      const newTabs = tabs.filter((t) => t.id !== tabId);

      // If we closed the active tab, switch to another one
      let newActiveId = activeTabId;
      if (activeTabId === tabId) {
        newActiveId = newTabs.length > 0 ? newTabs[0].id : null;
        if (newActiveId) {
          await invoke<Tab>("switch_tab", { tabId: newActiveId });
        }
      }

      set({
        tabs: newTabs,
        activeTabId: newActiveId,
      });
    } catch (error) {
      console.error("Failed to close tab:", error);
    }
  },

  switchTab: async (tabId) => {
    try {
      const tab = await invoke<Tab>("switch_tab", { tabId });
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === tabId
            ? { ...t, is_active: true }
            : { ...t, is_active: false }
        ),
        activeTabId: tab.id,
      }));
    } catch (error) {
      console.error("Failed to switch tab:", error);
    }
  },

  navigateTab: async (tabId, url) => {
    try {
      // Fetch favicon for the URL
      const favicon = buildFaviconUrl(url);

      const tab = await invoke<Tab>("navigate_tab", { tabId, url });

      // Update tab with favicon
      const tabWithFavicon = { ...tab, favicon };

      // Update tab history for back/forward navigation
      set((state) => {
        const currentHistory = state.tabHistory[tabId] || [];
        const currentIndex = state.tabHistoryIndex[tabId] || -1;

        // If we're not at the end of history, truncate the forward history
        const newHistory = currentHistory.slice(0, currentIndex + 1);
        newHistory.push(url);

        // Record in global history
        invoke("record_history", { url, title: tab.title }).catch(
          console.error
        );

        return {
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...tabWithFavicon, favicon } : t
          ),
          tabHistory: {
            ...state.tabHistory,
            [tabId]: newHistory,
          },
          tabHistoryIndex: {
            ...state.tabHistoryIndex,
            [tabId]: newHistory.length - 1,
          },
        };
      });
    } catch (error) {
      console.error("Failed to navigate tab:", error);
    }
  },

  goBack: async (tabId) => {
    const { tabHistory, tabHistoryIndex } = get();
    const history = tabHistory[tabId] || [];
    const index = tabHistoryIndex[tabId] || 0;

    if (index > 0) {
      const newIndex = index - 1;
      const url = history[newIndex];

      set((state) => ({
        tabHistoryIndex: {
          ...state.tabHistoryIndex,
          [tabId]: newIndex,
        },
      }));

      // Update the tab URL without adding to history
      try {
        const tab = await invoke<Tab>("navigate_tab", { tabId, url });
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? tab : t)),
        }));
      } catch (error) {
        console.error("Failed to go back:", error);
      }
    }
  },

  goForward: async (tabId) => {
    const { tabHistory, tabHistoryIndex } = get();
    const history = tabHistory[tabId] || [];
    const index = tabHistoryIndex[tabId] || 0;

    if (index < history.length - 1) {
      const newIndex = index + 1;
      const url = history[newIndex];

      set((state) => ({
        tabHistoryIndex: {
          ...state.tabHistoryIndex,
          [tabId]: newIndex,
        },
      }));

      // Update the tab URL without adding to history
      try {
        const tab = await invoke<Tab>("navigate_tab", { tabId, url });
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? tab : t)),
        }));
      } catch (error) {
        console.error("Failed to go forward:", error);
      }
    }
  },

  refreshTab: async (tabId) => {
    const { tabs } = get();
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      // Reload the current URL
      try {
        const updatedTab = await invoke<Tab>("navigate_tab", {
          tabId,
          url: tab.url,
        });
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? updatedTab : t)),
        }));
      } catch (error) {
        console.error("Failed to refresh tab:", error);
      }
    }
  },

  canGoBack: (tabId) => {
    const { tabHistoryIndex } = get();
    const index = tabHistoryIndex[tabId] || 0;
    return index > 0;
  },

  canGoForward: (tabId) => {
    const { tabHistory, tabHistoryIndex } = get();
    const history = tabHistory[tabId] || [];
    const index = tabHistoryIndex[tabId] || 0;
    return index < history.length - 1;
  },

  refreshTabs: async () => {
    try {
      const tabs = await invoke<Tab[]>("get_tabs");
      const activeTab = tabs.find((t) => t.is_active);
      set({
        tabs,
        activeTabId: activeTab?.id ?? (tabs.length > 0 ? tabs[0].id : null),
      });
    } catch (error) {
      console.error("Failed to refresh tabs:", error);
    }
  },

  loadHistory: async () => {
    try {
      const history = await invoke<HistoryEntry[]>("get_history");
      set({ history });
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
    if (mode === "agent") {
      set({ isAgentPanelOpen: true });
    }
  },

  toggleAgentPanel: () => {
    set((state) => ({ isAgentPanelOpen: !state.isAgentPanelOpen }));
  },

  setAgentPanelOpen: (open) => {
    set({ isAgentPanelOpen: open });
  },
}));
