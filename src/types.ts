// Tab types
export type TabId = string;

export interface Tab {
  id: TabId;
  url: string;
  title: string;
  favicon?: string;
  position: number;
  is_active: boolean;
}

// Agent types
export type MessageRole = "user" | "assistant" | "system";

export interface ConversationMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  tab_id?: TabId;
  model_provider: string;
  messages: ConversationMessage[];
}

export interface AgentMessageRequest {
  conversation_id?: string;
  tab_id?: TabId;
  message: string;
  provider: string;
  model: string;
}

export interface AgentMessageResponse {
  conversation_id: string;
  response: string;
}

// History types
export interface HistoryEntry {
  id: number;
  url: string;
  title?: string;
  visit_count: number;
  last_visit: string;
}

// Bookmark types
export interface Bookmark {
  id: number;
  url: string;
  title: string;
  folder_id?: number;
  created_at: string;
}

// Settings types
export interface Settings {
  theme: "light" | "dark" | "system";
  default_search_engine: string;
  ai_provider: string;
  ai_model: string;
  agent_mode_enabled: boolean;
}

// UI types
export type ViewMode = "normal" | "agent";

export interface BrowserState {
  tabs: Tab[];
  activeTabId: TabId | null;
  viewMode: ViewMode;
  isAgentPanelOpen: boolean;
}
