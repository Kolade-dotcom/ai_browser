import { useState } from "react";
import { X, Moon, Sun, Monitor, Bot, Keyboard } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, updateSettings, setTheme } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<"general" | "ai" | "shortcuts">(
    "general"
  );

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-card rounded-2xl border border-border shadow-lg z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <Dialog.Title className="text-lg font-medium text-foreground">
                Settings
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Customize your Aether experience
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-48 border-r border-border p-4 space-y-1">
              <SidebarButton
                active={activeTab === "general"}
                onClick={() => setActiveTab("general")}
                icon={<Monitor className="w-4 h-4" />}
                label="General"
              />
              <SidebarButton
                active={activeTab === "ai"}
                onClick={() => setActiveTab("ai")}
                icon={<Bot className="w-4 h-4" />}
                label="AI & Agent"
              />
              <SidebarButton
                active={activeTab === "shortcuts"}
                onClick={() => setActiveTab("shortcuts")}
                icon={<Keyboard className="w-4 h-4" />}
                label="Shortcuts"
              />
            </div>

            {/* Settings content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === "general" && (
                <div className="space-y-6">
                  {/* Theme */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">
                      Appearance
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <ThemeOption
                        label="Light"
                        icon={<Sun className="w-5 h-5" />}
                        selected={settings.theme === "light"}
                        onClick={() => setTheme("light")}
                      />
                      <ThemeOption
                        label="Dark"
                        icon={<Moon className="w-5 h-5" />}
                        selected={settings.theme === "dark"}
                        onClick={() => setTheme("dark")}
                      />
                      <ThemeOption
                        label="System"
                        icon={<Monitor className="w-5 h-5" />}
                        selected={settings.theme === "system"}
                        onClick={() => setTheme("system")}
                      />
                    </div>
                  </section>

                  {/* Search Engine */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">
                      Search Engine
                    </h3>
                    <select
                      value={settings.default_search_engine}
                      onChange={(e) =>
                        updateSettings({
                          default_search_engine: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="google">Google</option>
                      <option value="duckduckgo">DuckDuckGo</option>
                      <option value="bing">Bing</option>
                    </select>
                  </section>
                </div>
              )}

              {activeTab === "ai" && (
                <div className="space-y-6">
                  {/* AI Provider */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">
                      AI Provider
                    </h3>
                    <select
                      value={settings.ai_provider}
                      onChange={(e) =>
                        updateSettings({ ai_provider: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="ollama">Ollama (Local)</option>
                    </select>
                  </section>

                  {/* AI Model */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">
                      Model
                    </h3>
                    <select
                      value={settings.ai_model}
                      onChange={(e) =>
                        updateSettings({ ai_model: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {settings.ai_provider === "openai" && (
                        <>
                          <option value="gpt-4o">GPT-4o</option>
                          <option value="gpt-4o-mini">GPT-4o Mini</option>
                        </>
                      )}
                      {settings.ai_provider === "anthropic" && (
                        <>
                          <option value="claude-3-opus">Claude 3 Opus</option>
                          <option value="claude-3-sonnet">
                            Claude 3 Sonnet
                          </option>
                        </>
                      )}
                      {settings.ai_provider === "ollama" && (
                        <option value="llama3">Llama 3</option>
                      )}
                    </select>
                  </section>
                </div>
              )}

              {activeTab === "shortcuts" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground mb-4">
                    Keyboard Shortcuts
                  </h3>
                  <div className="space-y-2">
                    <ShortcutRow action="New Tab" shortcut="Ctrl/Cmd + T" />
                    <ShortcutRow action="Close Tab" shortcut="Ctrl/Cmd + W" />
                    <ShortcutRow
                      action="Focus Address Bar"
                      shortcut="Ctrl/Cmd + L"
                    />
                    <ShortcutRow
                      action="Toggle Aether Panel"
                      shortcut="Ctrl/Cmd + Shift + A"
                    />
                    <ShortcutRow
                      action="Previous Tab"
                      shortcut="Ctrl/Cmd + ["
                    />
                    <ShortcutRow action="Next Tab" shortcut="Ctrl/Cmd + ]" />
                    <ShortcutRow
                      action="Switch to Tab 1-9"
                      shortcut="Ctrl/Cmd + 1-9"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SidebarButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ThemeOption({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
        selected
          ? "border-primary bg-primary/5 text-primary"
          : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function ShortcutRow({
  action,
  shortcut,
}: {
  action: string;
  shortcut: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50">
      <span className="text-sm text-foreground">{action}</span>
      <kbd className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground font-mono">
        {shortcut}
      </kbd>
    </div>
  );
}
