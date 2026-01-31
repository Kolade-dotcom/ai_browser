# Aether

> Browse lightly. Think deeply.

Aether is a lightweight, AI-native browser designed for thoughtful exploration. Seamlessly switch between focused browsing and intelligent assistance.

## Features

- **Ultra-lightweight**: ~3MB base bundle vs 150MB+ Electron apps
- **Truly switchable**: Seamless toggle between "normal browsing" and "agent mode"
- **Bring-your-own AI**: Works with local models (Ollama/LMStudio), APIs (OpenAI/Anthropic), or hybrid
- **Privacy-first**: Local SQLite database — your data stays on your machine
- **Claude-inspired UI**: Minimalist, warm, illustration-based design

## Why "Aether"?

In classical philosophy, **aether** was the fifth element — the divine substance that filled the universe beyond the earthly sphere. It represents:

- **Lightness**: The upper air, unburdened and free-flowing
- **Clarity**: A medium for light and energy
- **The fifth element**: Earth, water, air, fire... and now AI as aether — the substance that elevates browsing beyond the ordinary

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React + TypeScript + Tailwind CSS |
| **Desktop Shell** | Tauri (Rust) |
| **State Management** | Zustand |
| **Database** | SQLite (via sqlx) |
| **Browser Control** | CDP (Chrome DevTools Protocol) |

## Project Structure

```
aether/
├── src/                          # React frontend
│   ├── components/               # UI components
│   ├── stores/                   # Zustand state stores
│   ├── lib/                      # Utilities
│   ├── types.ts                  # TypeScript types
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   ├── browser.rs            # CDP browser management
│   │   ├── commands.rs           # Tauri command handlers
│   │   ├── db.rs                 # Database initialization
│   │   ├── storage.rs            # Data access layer
│   │   └── error.rs              # Error types
│   ├── Cargo.toml
│   └── tauri.conf.json
└── package.json
```

## Prerequisites

- [Rust](https://rustup.rs/) 1.70+
- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) (recommended)
- Chrome, Edge, or Chromium installed

## Development Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   cd src-tauri && cargo fetch
   ```

2. **Run in development mode:**
   ```bash
   pnpm tauri:dev
   ```

3. **Build for production:**
   ```bash
   pnpm tauri:build
   ```

## Design System

Aether follows a Claude-inspired design philosophy:

- **Warm color palette**: Clay, cream, and sage tones
- **Soft UI elements**: Rounded corners, subtle shadows
- **Illustration-based**: Abstract organic shapes for empty states
- **Typography**: Inter for UI, Source Serif for headings
- **Focus on simplicity**: Minimal chrome, maximum content space

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + T` | New tab |
| `Cmd/Ctrl + W` | Close tab |
| `Cmd/Ctrl + L` | Focus address bar |
| `Cmd/Ctrl + Shift + A` | Toggle Aether (Agent) panel |
| `Cmd/Ctrl + [` | Previous tab |
| `Cmd/Ctrl + ]` | Next tab |

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server |
| `pnpm tauri:dev` | Start Tauri in dev mode |
| `pnpm tauri:build` | Build production binary |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Run Prettier |

## Roadmap

### Phase 1: MVP (Core Browser)
- [x] Basic browser shell (Tauri + WebView)
- [x] Tab management (create, close, switch)
- [x] Address bar with navigation
- [x] Simple agent mode UI
- [x] SQLite database for persistence

### Phase 2: Enhanced Agent
- [ ] CDP integration for browser control
- [ ] Multi-provider AI support (OpenAI, Anthropic, Ollama)
- [ ] Agent memory/persistence
- [ ] Vision capability (screenshots)

### Phase 3: Power User Features
- [ ] Workspace/Profiles
- [ ] Agent Workflows
- [ ] Smart History with AI search
- [ ] Command palette (`Cmd/Ctrl + Shift + A`)

## License

MIT
