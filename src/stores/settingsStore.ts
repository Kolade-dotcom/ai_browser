import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Settings } from "@/types";

interface SettingsStore {
  // State
  settings: Settings;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  setTheme: (theme: Settings["theme"]) => Promise<void>;
  toggleAgentMode: () => Promise<void>;
}

const defaultSettings: Settings = {
  theme: "light",
  default_search_engine: "google",
  ai_provider: "openai",
  ai_model: "gpt-4o",
  agent_mode_enabled: false,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    try {
      const settings = await invoke<Settings>("get_settings");
      set({ settings });
    } catch (error) {
      console.error("Failed to load settings:", error);
      // Use defaults if loading fails
      set({ settings: defaultSettings });
    }
  },

  updateSettings: async (newSettings) => {
    const { settings } = get();
    const updatedSettings = { ...settings, ...newSettings };

    try {
      await invoke("update_settings", { settings: updatedSettings });
      set({ settings: updatedSettings });
    } catch (error) {
      console.error("Failed to update settings:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to update settings",
      });
    }
  },

  setTheme: async (theme) => {
    const { updateSettings } = get();
    await updateSettings({ theme });

    // Apply theme to document
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  },

  toggleAgentMode: async () => {
    const { settings, updateSettings } = get();
    await updateSettings({ agent_mode_enabled: !settings.agent_mode_enabled });
  },
}));
