import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  Conversation,
  ConversationMessage,
  AgentMessageRequest,
  AgentMessageResponse,
  TabId,
} from "@/types";

interface AgentStore {
  // State
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  selectedProvider: string;
  selectedModel: string;

  // Actions
  sendMessage: (message: string, tabId?: TabId) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  createNewConversation: (tabId?: TabId) => void;
  clearError: () => void;
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  currentConversation: null,
  isLoading: false,
  error: null,
  selectedProvider: "openai",
  selectedModel: "gpt-4o",

  sendMessage: async (message: string, tabId?: TabId) => {
    const { currentConversation, selectedProvider, selectedModel } = get();

    set({ isLoading: true, error: null });

    try {
      // Add user message to local state immediately
      const userMessage: ConversationMessage = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };

      set((state) => ({
        currentConversation: state.currentConversation
          ? {
              ...state.currentConversation,
              messages: [...state.currentConversation.messages, userMessage],
            }
          : {
              id: "",
              tab_id: tabId,
              model_provider: selectedProvider,
              messages: [userMessage],
            },
      }));

      const request: AgentMessageRequest = {
        conversation_id: currentConversation?.id,
        tab_id: tabId,
        message,
        provider: selectedProvider,
        model: selectedModel,
      };

      const response = await invoke<AgentMessageResponse>(
        "send_agent_message",
        {
          request,
        }
      );

      // Add assistant response
      const assistantMessage: ConversationMessage = {
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
      };

      set((state) => ({
        currentConversation: state.currentConversation
          ? {
              ...state.currentConversation,
              id: response.conversation_id,
              messages: [
                ...state.currentConversation.messages,
                assistantMessage,
              ],
            }
          : {
              id: response.conversation_id,
              tab_id: tabId,
              model_provider: selectedProvider,
              messages: [userMessage, assistantMessage],
            },
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to send message:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to send message",
        isLoading: false,
      });
    }
  },

  loadConversation: async (conversationId: string) => {
    try {
      const conversation = await invoke<Conversation | null>(
        "get_conversation",
        {
          conversationId,
        }
      );
      if (conversation) {
        set({ currentConversation: conversation });
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  },

  createNewConversation: (tabId?: TabId) => {
    set({
      currentConversation: {
        id: "",
        tab_id: tabId,
        model_provider: get().selectedProvider,
        messages: [],
      },
      error: null,
    });
  },

  clearError: () => set({ error: null }),

  setProvider: (provider: string) => {
    set({ selectedProvider: provider });
  },

  setModel: (model: string) => {
    set({ selectedModel: model });
  },
}));
