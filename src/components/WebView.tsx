import type { Tab } from "@/types";
import { IllustrationPlaceholder } from "./IllustrationPlaceholder";

interface WebViewProps {
  tab: Tab | undefined;
}

export function WebView({ tab }: WebViewProps) {
  if (!tab) {
    return (
      <div className="flex-1 flex items-center justify-center h-full gradient-warm">
        <IllustrationPlaceholder />
      </div>
    );
  }

  // For now, show a placeholder when there's no real browser engine
  // In the full implementation, this would embed a WebView or CDP-controlled browser
  const isBlank = tab.url === "about:blank" || !tab.url;

  return (
    <div className="w-full h-full bg-background">
      {isBlank ? (
        <div className="flex-1 flex flex-col items-center justify-center h-full gradient-warm">
          <IllustrationPlaceholder />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col">
          {/* Browser viewport placeholder */}
          <div className="flex-1 bg-white">
            <iframe
              src={tab.url}
              title={tab.title}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
        </div>
      )}
    </div>
  );
}
