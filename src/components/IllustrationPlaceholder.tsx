import { Sparkles } from "lucide-react";

export function IllustrationPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8">
      {/* Abstract Claude-inspired illustration */}
      <div className="relative w-48 h-48">
        {/* Background gradient blob */}
        <div
          className="absolute inset-0 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, hsl(15, 35%, 88%), hsl(25, 30%, 92%) 50%, hsl(20, 25%, 85%))",
            filter: "blur(1px)",
          }}
        />

        {/* Organic shape 1 - Clay/warm tone */}
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 w-full h-full"
          style={{ transform: "rotate(-15deg)" }}
        >
          <defs>
            <linearGradient id="clay1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(15, 40%, 78%)" />
              <stop offset="100%" stopColor="hsl(18, 35%, 68%)" />
            </linearGradient>
          </defs>
          <ellipse
            cx="100"
            cy="100"
            rx="60"
            ry="70"
            fill="url(#clay1)"
            opacity="0.8"
          />
        </svg>

        {/* Organic shape 2 - Sage accent */}
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 w-full h-full"
          style={{ transform: "rotate(30deg) translate(10px, -10px)" }}
        >
          <defs>
            <linearGradient id="sage1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(130, 15%, 75%)" />
              <stop offset="100%" stopColor="hsl(135, 12%, 65%)" />
            </linearGradient>
          </defs>
          <ellipse
            cx="100"
            cy="100"
            rx="45"
            ry="55"
            fill="url(#sage1)"
            opacity="0.6"
          />
        </svg>

        {/* Organic shape 3 - Cream highlight */}
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 w-full h-full"
          style={{ transform: "rotate(60deg) translate(-15px, 20px)" }}
        >
          <defs>
            <linearGradient id="cream1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(35, 40%, 94%)" />
              <stop offset="100%" stopColor="hsl(30, 35%, 88%)" />
            </linearGradient>
          </defs>
          <ellipse
            cx="100"
            cy="100"
            rx="35"
            ry="40"
            fill="url(#cream1)"
            opacity="0.7"
          />
        </svg>

        {/* Center sparkle icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Sparkles className="w-8 h-8 text-clay-500" />
          </div>
        </div>
      </div>

      {/* Text */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-medium text-foreground font-serif tracking-tight">
          Aether
        </h1>
        <p className="text-sm text-clay-600 font-medium">
          Browse lightly. Think deeply.
        </p>
        <p className="text-xs text-muted-foreground pt-2">
          Open a new tab to get started
        </p>
      </div>
    </div>
  );
}
