import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore } from "@/stores/agentStore";
import { useBrowserStore } from "@/stores/browserStore";
import { cn } from "@/lib/utils";

export function AgentPanel() {
  const { activeTabId } = useBrowserStore();
  const { currentConversation, isLoading, sendMessage, createNewConversation } =
    useAgentStore();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentConversation?.messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim(), activeTabId || undefined);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 380, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="flex flex-col border-l border-border/50 bg-cream-50/30 h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="agent-pulse w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm text-foreground">Aether</h3>
            <p className="text-xs text-muted-foreground">
              Your browsing companion
            </p>
          </div>
        </div>
        <button
          onClick={() => createNewConversation(activeTabId || undefined)}
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title="New conversation"
        >
          <Bot className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4"
      >
        {!currentConversation || currentConversation.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-clay-200 to-clay-100 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-clay-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                How can I help you browse?
              </p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Ask me to navigate, search, or help with anything on the web.
              </p>
            </div>
            <div className="space-y-2 w-full">
              <SuggestionButton
                text="Search for React tutorials"
                onClick={() =>
                  sendMessage(
                    "Search for React tutorials",
                    activeTabId || undefined
                  )
                }
              />
              <SuggestionButton
                text="Go to GitHub"
                onClick={() =>
                  sendMessage(
                    "Navigate to github.com",
                    activeTabId || undefined
                  )
                }
              />
              <SuggestionButton
                text="Summarize this page"
                onClick={() =>
                  sendMessage(
                    "Summarize the current page",
                    activeTabId || undefined
                  )
                }
              />
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {currentConversation.messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-sage-100 text-sage-700"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Message */}
                <div
                  className={cn(
                    "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  )}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            className={cn(
              "w-full px-4 py-3 pr-12 rounded-xl resize-none",
              "bg-background border border-border/50",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
              "transition-all"
            )}
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg",
              "transition-all",
              input.trim() && !isLoading
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-muted-foreground"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-center text-muted-foreground">
          AI can make mistakes. Please verify important information.
        </p>
      </div>
    </motion.div>
  );
}

function SuggestionButton({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 text-left text-sm rounded-lg",
        "bg-background/50 hover:bg-background border border-border/30",
        "text-muted-foreground hover:text-foreground",
        "transition-colors"
      )}
    >
      {text}
    </button>
  );
}
