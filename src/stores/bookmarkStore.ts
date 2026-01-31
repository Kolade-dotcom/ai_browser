import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Bookmark } from "@/types";

interface BookmarkStore {
  bookmarks: Bookmark[];
  isLoading: boolean;
  showBookmarksBar: boolean;

  // Actions
  loadBookmarks: () => Promise<void>;
  addBookmark: (url: string, title: string) => Promise<void>;
  deleteBookmark: (id: number) => Promise<void>;
  toggleBookmarksBar: () => void;
}

export const useBookmarkStore = create<BookmarkStore>((set) => ({
  bookmarks: [],
  isLoading: false,
  showBookmarksBar: true,

  loadBookmarks: async () => {
    try {
      const bookmarks = await invoke<Bookmark[]>("get_bookmarks");
      set({ bookmarks });
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
    }
  },

  addBookmark: async (url: string, title: string) => {
    try {
      const bookmark = await invoke<Bookmark>("add_bookmark", {
        url,
        title,
        folder_id: null,
      });
      set((state) => ({
        bookmarks: [bookmark, ...state.bookmarks],
      }));
    } catch (error) {
      console.error("Failed to add bookmark:", error);
    }
  },

  deleteBookmark: async (id: number) => {
    try {
      await invoke("delete_bookmark", { id });
      set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete bookmark:", error);
    }
  },

  toggleBookmarksBar: () => {
    set((state) => ({ showBookmarksBar: !state.showBookmarksBar }));
  },
}));
