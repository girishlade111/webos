# WebOS — Web-Based Virtual Desktop Operating System 🚀💻

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.style=for-the-badge)](LICENSE)

**WebOS** is a production-grade, pixel-polished, macOS-inspired virtual operating system running **100% client-side** in your web browser. Built with modern web technologies including **React 19**, **TypeScript**, **Tailwind CSS v4**, **Zustand**, and **Web Audio API**, WebOS delivers a seamless desktop environment with responsive windows, procedural sound effects, a virtual file system, dynamic widgets, and an extensive suite of built-in applications.

---

## 🌟 Key Highlights & Features

### 🔐 Boot, Lock Screen & Authentication
* **Procedural Boot Sequence**: Features an interactive bootloader screen with smooth progress bar animations and a real-time synthesized harmonic major 9th swell audio chime using the Web Audio API.
* **Dynamic Lock Screen**: Glassmorphism backdrop with live digital clock, current date, user profile avatar, and an animated password authentication system (includes dynamic feedback and shake effect on invalid entry).
* **Power Controls**: Fully functional Power Management lifecycle supporting **Sleep Mode** (fade-to-black state with click-to-wake capability), **System Restart** (clean reboot cycle), and **Shut Down**.

---

### 🖥️ Desktop Shell & System Navigation
* **Top Menu Bar**: 28px frosted-glass system header featuring:
  * **WebOS Menu**: System status, About WebOS, System Settings shortcut, Lock Screen, and Power Options.
  * **Dynamic App Menus**: Contextual menu options (File, Edit, View, Window, Help) that adapt dynamically based on the currently focused application.
  * **Status Indicators**: Real-time Wi-Fi connectivity indicator, battery level display, master volume controls, and digital clock.
  * **Control Center Toggle & Spotlight Launcher**: Quick access buttons right from the menu bar.
* **Interactive Dock**:
  * **Fisheye Magnification**: Proximity-based smooth icon scaling.
  * **App State Indicators**: Active running indicator dots under open application icons.
  * **Physics & Animations**: Smooth launch bounce animations.
  * **Contextual Right-Click Menu**: Quick access options including *Keep in Dock*, *Show All Windows*, and *Quit*.
  * **Minimized Windows & Trash**: Minimized window preview cards and dynamic empty/full trash bin states.
* **Desktop Workspace**:
  * **Wallpaper Engine**: 5 procedural dual-mode (Light/Dark) high-definition wallpapers.
  * **Grid Snapping**: Automatic grid alignment for desktop shortcut icons.
  * **Rubber-Band Drag Selection**: Drag-to-select box for batch icon selection.

---

### 🪟 Advanced Window Management System
* **60 FPS Window Manipulation**: Ultra-smooth window dragging and 8-direction edge/corner resizing.
* **macOS Traffic-Light Controls**: Fully functional Close (red), Minimize (yellow), and Maximize/Zoom (green) control buttons with hover glyphs.
* **Edge & Corner Snapping**:
  * Drag window to left/right screen edge for automatic 50% half-screen split layout.
  * Drag window to top screen edge for full-screen window snap preview.
* **Z-Index Focus Stacking**: Automatic active window layering, focus management, and persistent window state handling.

---

### 🔊 Procedural Web Audio Sound Engine
* **Zero External Audio Files**: 100% synthesized sound effects synthesized live using Web Audio API oscillators and gain envelopes.
* **Interactive Audio Feedback**:
  * Window open (`playWindowOpen`) & close (`playWindowClose`)
  * Genie minimize glissando (`playWindowMinimize`) & double-pop maximize (`playWindowMaximize`)
  * Magnetic edge snapping click (`playWindowSnap`) & focus ticks (`playWindowFocus`)
  * Dock icon interaction (`playDockClick`), Notification glass chime (`playNotification`), and Trash rustle (`playTrash`)
* **Sound Controls**: Toggle system sounds, adjust master volume, or preview audio effects in **System Settings > Sound** or through the **Control Center**.

---

### 🧰 Built-In Application Suite

| Icon | Application | Description |
| :---: | :--- | :--- |
| 📁 | **Finder** | Hierarchical virtual file explorer featuring grid/list views, quick search, file uploads/downloads, file property inspector ("Get Info"), and Quick Look preview (`Space`). |
| 🌐 | **Web Browser ("Web")** | Tabbed browsing experience with custom start page, search bar, bookmark management, and fallback site iframe renderer. |
| 💻 | **Terminal** | Full Unix-like shell command line supporting commands like `ls`, `cd`, `pwd`, `cat`, `mkdir`, `touch`, `rm`, `echo`, `calc`, `neofetch`, theme customization, and command history. |
| 📝 | **Notes** | Dual-pane rich-text note taking application featuring search, category grouping, formatting toolbar (bold, italic, headers, checklists), and autosave. |
| ✏️ | **TextEdit** | Multi-tab plain text and code editor with line numbers, syntax highlighting cues, and file saving directly into the WebOS Virtual File System. |
| 🧮 | **Calculator** | Dual-mode standard and scientific calculator supporting keyboard input, memory operations, and an interactive calculation history tape. |
| 📅 | **Calendar** | Month view calendar widget displaying current day highlight, agenda schedules, event creation modal, and category tags. |
| 🖼️ | **Photos** | Media gallery app featuring full-screen lightbox viewer, image zoom, 90° rotation, slide presentation mode, and color filters (B&W, Sepia, Invert, Warm, High Contrast). |
| 🎵 | **Music Player** | Audio player featuring built-in procedural synthetic music tracks, animated sound visualizer bars, track queue, and full media playback controls. |
| 🌤️ | **Weather** | Live weather dashboard showcasing current temperature, atmospheric conditions, humidity, wind velocity, hourly forecast, and a 7-day outlook. |
| ⚙️ | **System Settings** | OS configuration portal for personalizing appearance (Light/Dark themes, 8 accent color themes), desktop wallpapers, dock parameters, sound effects, display scaling, and OS hard reset. |
| 📊 | **Activity Monitor** | Real-time system performance monitor displaying CPU usage, memory utilization graphs, active system processes, and Force Quit process termination. |
| 🛍️ | **App Store** | Software marketplace directory showcasing featured apps, categorized browse views, and one-click dock pinning. |

---

### ⚡ System Overlays & Quick Tools

* **Spotlight Search** (`Cmd/Ctrl + Space`): Global fuzzy search modal searching across installed applications, virtual files, settings, and instant mathematical evaluation.
* **Control Center**: Quick-toggle panel for Wi-Fi, Bluetooth, Dark Mode, Do Not Disturb, display brightness slider, master volume slider, and Now Playing media controller.
* **Notification Center**: Slide-out panel aggregating system notices, weather summaries, calendar events, and interactive toast notifications.
* **Mission Control** (`F3` or `Ctrl + Up`): Overview grid layout showing all open windows simultaneously across active Virtual Desktops (Spaces).
* **Launchpad** (`Cmd + Shift + L`): Fullscreen application launcher grid with search filtering.
* **App Switcher** (`Cmd/Ctrl + Tab`): Fast application multitasking switcher UI.

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| `⌘/Ctrl + Space` | Trigger Spotlight Global Search |
| `⌘/Ctrl + W` | Close currently focused window |
| `⌘/Ctrl + M` | Minimize currently focused window |
| `⌘/Ctrl + Tab` | Open Task / App Switcher |
| `F3` / `Ctrl + ↑` | Open Mission Control (Exposé) |
| `⌘ + Shift + L` | Toggle Launchpad app launcher |
| `Space` *(in Finder)* | Trigger Quick Look file preview |
| `Esc` | Dismiss open menus, overlays, or active modals |

---

## 🏗️ Tech Stack & Architecture

- **Core Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tooling**: [Vite 6](https://vitejs.dev/)
- **Styling & Design System**: [Tailwind CSS v4](https://tailwindcss.com/) + Custom Glassmorphism CSS Variables
- **State Management**: [Zustand 5](https://github.com/pmndrs/zustand) (Modular stores for Windows, System, Filesystem, Settings)
- **Animations**: [Motion](https://motion.dev/) (Framer Motion) + [@use-gesture/react](https://use-gesture.github.io/)
- **Iconography**: [Lucide React](https://lucide.dev/)
- **Storage**: Browser IndexedDB via [`idb-keyval`](https://github.com/jakearchibald/idb-keyval) & `localStorage`
- **Audio**: Web Audio API (Synthesized Oscillators & Sound Nodes)
- **AI Integration**: [@google/genai](https://www.npmjs.com/package/@google/genai)

---

## 📁 Repository Directory Structure

```
webos/
├── public/                 # Static public assets, favicons, & web manifest
├── src/
│   ├── apps/               # Bundled WebOS Applications (Finder, Terminal, Settings, etc.)
│   ├── assets/             # Wallpapers, sound presets, and static graphics
│   ├── core/               # Core engine systems (Virtual FS, Audio Synth, Event Bus, State)
│   ├── shell/              # OS Shell Components (Menu Bar, Dock, Lock Screen, Spotlight, etc.)
│   ├── types/              # TypeScript type definitions and interfaces
│   ├── App.tsx             # Main WebOS Shell Entrypoint
│   ├── index.css           # Global Tailwind CSS & custom design tokens
│   └── main.tsx            # React application root mounting
├── .gitignore              # Git ignore configuration
├── index.html              # Single Page Application HTML template
├── package.json            # Project dependencies and script runner setup
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build engine configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have one of the following JavaScript runtimes installed on your machine:
* [Node.js](https://nodejs.org/) (v18.0 or later recommended)
* [Bun](https://bun.sh/) (Optional alternative package manager)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/girishlade111/webos.git
   cd webos
   ```

2. **Install project dependencies**:
   Using `npm`:
   ```bash
   npm install
   ```
   Or using `bun`:
   ```bash
   bun install
   ```

### Development Server

Start the local development server with hot module replacement (HMR):

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to interact with WebOS locally.

### Production Build

To build the application for production deployment:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## ⚙️ Configuration & Environment Variables

Copy `.env.example` to `.env` if custom environment variables (such as Gemini API keys for AI integration features) are required:

```bash
cp .env.example .env
```

---

## 📜 License

This project is open-source and released under the **[MIT License](LICENSE)**. Feel free to use, modify, and distribute it for personal or commercial projects.

---

## 🤝 Contributing & Feedback

Contributions, feature requests, and bug reports are warmly welcomed!
- Feel free to open an **Issue** or submit a **Pull Request**.
- If you enjoy this project, please give it a ⭐️ on GitHub!

---

**Built by Girish Lade** — [ladestack.in](https://ladestack.in)
