import { useState } from "react";
import { useBrowserStore } from "@/stores/browserStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Bot, X, Moon, Sun, Settings, Cog } from "lucide-react";
import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { SettingsPanel } from "./SettingsPanel";

export function ModeToggle() {
  const { viewMode, toggleAgentPanel } = useBrowserStore();
  const { settings, setTheme } = useSettingsStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      {/* Theme toggle */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className={cn(
              "p-2 rounded-lg transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            {settings.theme === "dark" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[140px] bg-popover text-popover-foreground rounded-xl border border-border shadow-lg p-1 z-50"
            sideOffset={4}
            align="end"
          >
            <DropdownMenu.Item
              onClick={() => setTheme("light")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer",
                "hover:bg-secondary transition-colors",
                settings.theme === "light" && "bg-secondary"
              )}
            >
              <Sun className="w-4 h-4" />
              Light
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={() => setTheme("dark")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer",
                "hover:bg-secondary transition-colors",
                settings.theme === "dark" && "bg-secondary"
              )}
            >
              <Moon className="w-4 h-4" />
              Dark
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onClick={() => setTheme("system")}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer",
                "hover:bg-secondary transition-colors",
                settings.theme === "system" && "bg-secondary"
              )}
            >
              <Settings className="w-4 h-4" />
              System
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Settings button */}
      <button
        onClick={() => setSettingsOpen(true)}
        className={cn(
          "p-2 rounded-lg transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
        title="Settings"
      >
        <Cog className="w-4 h-4" />
      </button>

      {/* Agent panel toggle */}
      <button
        onClick={toggleAgentPanel}
        className={cn(
          "p-2 rounded-lg transition-colors",
          viewMode === "agent"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
        title={viewMode === "agent" ? "Close AI panel" : "Open AI panel"}
      >
        {viewMode === "agent" ? (
          <X className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </button>

      {/* Settings Panel */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
