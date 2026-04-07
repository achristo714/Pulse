# Pulse Desktop (Electron)

Always-on-top desktop app for Pulse.

## Setup

```bash
cd electron
npm install
```

## Development

Run alongside the web dev server:
```bash
# Terminal 1 — web app
cd ..
npm run dev

# Terminal 2 — electron (connects to local dev)
npm run dev
```

## Production

The desktop app loads from your Vercel deployment by default:
```bash
npm start
```

## Build Installers

```bash
# macOS
npm run build:mac

# Windows  
npm run build:win

# Linux
npm run build:linux
```

## Features

- **Always on Top**: Dock mode pins Pulse above all windows
- **System Tray**: Minimize to tray, click to restore
- **Global Shortcuts**:
  - `Cmd/Ctrl + Shift + P` — Toggle Pulse window
  - `Cmd/Ctrl + Shift + D` — Toggle dock mode (always on top)
  - `Cmd/Ctrl + Shift + N` — Quick add task

## Dock Mode

Right-click the tray icon → "Dock Mode" to pin Pulse as a small
always-on-top widget in the bottom-right corner. It stays above
all other windows so tasks never get lost behind tabs.

Press `Cmd/Ctrl + Shift + D` to toggle dock mode on/off.
```

## Icons

You need to provide:
- `icon.png` — app icon (512x512)
- `tray-icon.png` — tray icon (16x16 or 22x22, simple monochrome)
