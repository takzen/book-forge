# Book Forge ⚒️📖

<div align="center">

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg?style=for-the-badge)](https://github.com/takzen/book-forge/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](./LICENSE)
[![Electron](https://img.shields.io/badge/Electron-44-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Drizzle_ORM-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://orm.drizzle.team/)
[![Playwright](https://img.shields.io/badge/PDF_Engine-Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-FCC72B?style=for-the-badge&logo=vitest&logoColor=black)](https://vitest.dev/)

<p align="center">
  <b>A private, offline-first local workspace for writing books in Markdown, designing covers, and exporting print-ready PDFs.</b>
</p>

</div>

---

## 🌟 Overview

**Book Forge** is an all-in-one, local desktop web application designed for authors, researchers, and technical writers who want to write and publish books without relying on cloud services, accounts, subscriptions, or proprietary formats.

Everything stays **100% offline** on your computer.

```text
New Book ➔ Add Chapters & Outline ➔ Write in Markdown ➔ Add Local Images ➔ Design Cover ➔ Preview ➔ Export PDF
```

---

## ✨ Features

### 📚 1. Book Project & Structure Management
- **Multiple Page Formats**: Standard **A5** (fiction/non-fiction), **6 × 9 in** (trade book), and **A4** (workbook/manual).
- **Chapter Arrangement**: Add, rename, delete, and reorder chapters up/down on the fly.
- **Word Counts**: Live word counting per chapter and aggregated across the whole manuscript.
- **Local Storage**: Backed by high-performance SQLite via Drizzle ORM in the `data/` directory.

### ✍️ 2. Markdown Editor & Live Preview
- **Split-Screen Studio**: Dual-pane editor with live rendered preview using `react-markdown` and `remark-gfm`.
- **Formatting Toolbar & Hotkeys**: Quick shortcuts for headings (H1–H3), bold, italic, blockquotes, ordered/unordered lists, code, and links.
- **Embedded Media**: Upload local PNG, JPG, WebP, and GIF images (up to 20 MB) with 1-click Markdown embedding.
- **Real-Time Autosave**: Background autosave with non-intrusive status indicators so you never lose your progress.

### 🎨 3. Visual Cover Designer
- **Preset Design Themes**: *Classic Minimalist*, *Modern Emerald*, *Midnight Indigo*, *Terracotta Earth*.
- **Layer Editing**: Customizable typography, colors, background styles (solid, gradient, image), and logo/photo uploads.
- **300 DPI High-Resolution Export**: Renders a print-ready PNG cover and automatically binds it to your book's PDF output.

### 📖 4. Manuscript Preview & PDF Export
- **Print-Aware Book Template**: Seamless layout rendering cover page, half-title / title page, automatic Table of Contents (TOC), and paginated chapters.
- **Precise Page Breaks**: Built-in CSS Paged Media (`@page`, `break-after: page`) ensuring clean transitions between chapters.
- **Custom Typography**: Adjust font families (Serif, Sans, Monospace), font size, line height, and margins.
- **Dual Export Options**:
  - **Headless PDF Engine**: One-click PDF generation via **Playwright**.
  - **Browser Native Print**: Direct system print dialog fallback with full `@media print` support.

### 📦 5. Backup, Duplication & Portable ZIP Archives
- **1-Click Project Duplication**: Clone an entire book with all its chapters, settings, cover art, and local image assets.
- **Full ZIP Export**: Download your project as a self-contained `.zip` archive containing `book.json`, individual chapter `.md` files, and the `uploads/` folder.
- **ZIP Import**: Restore or migrate books across machines effortlessly.

### 🖥️ 6. Native Desktop Experience (Electron)
- **Standalone Window**: Runs as a lightweight local desktop app without browser toolbars.
- **Dynamic Zoom Controls**: Full zooming support via `Ctrl` + `+` / `-`, `Ctrl` + `0` (reset), and `Ctrl` + Mouse Wheel scroll.
- **Offline & Private**: Completely isolated on your local machine with automatic background server lifecycle management.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Desktop Wrapper** | [Electron 44](https://www.electronjs.org/) (Native window, auto-start, zoom integration) |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Database & ORM** | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) + [Drizzle ORM](https://orm.drizzle.team/) |
| **Markdown Engine** | [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) |
| **PDF Generation** | [Playwright](https://playwright.dev/) (Chromium headless) |
| **Archives** | [JSZip](https://stuk.github.io/jszip/) |
| **Test Suite** | [Vitest](https://vitest.dev/) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20.x or higher
- **pnpm**: v9.x or higher

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/takzen/book-forge.git
   cd book-forge
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Install Playwright browser binaries (for PDF generation):**
   ```bash
   pnpm exec playwright install chromium
   ```

4. **(Optional) Create a Desktop Shortcut (Windows):**
   ```bash
   pnpm shortcut
   ```

5. **Start Book Forge as a Desktop App (Electron):**
   ```bash
   pnpm electron:dev
   ```

   *Alternatively, to run only in the web browser:*
   ```bash
   pnpm dev
   ```

---

## 🧪 Available Scripts

- `pnpm electron:dev` — Start the application in an Electron desktop window with hot reload.
- `pnpm electron:start` — Run the production build in an Electron window.
- `pnpm electron` — Open the Electron wrapper directly.
- `pnpm shortcut` — Create a native Windows Desktop shortcut with icon for Book Forge.
- `pnpm dev` — Start the Next.js development server (browser mode).
- `pnpm build` — Build the optimized production application.
- `pnpm start` — Start the production server.
- `pnpm test` — Run the automated test suite with Vitest.
- `pnpm lint` — Run ESLint check.
- `pnpm db:generate` — Generate Drizzle ORM schema migrations.
- `pnpm db:push` — Push schema changes directly to SQLite.

---

## 📂 Project Structure

```text
book-forge/
├── data/                       # Local SQLite DB and uploaded media (auto-created)
│   ├── book-forge.db
│   └── uploads/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── books/[bookId]/export/  # ZIP archive export
│   │   │   ├── books/[bookId]/pdf/     # Playwright PDF rendering
│   │   │   └── uploads/                # Local image serving and uploading
│   │   ├── books/[bookId]/             # Manuscript editor studio
│   │   │   ├── cover/                  # Cover design studio
│   │   │   ├── preview/                # Full book preview & PDF controls
│   │   │   └── print/                  # Clean printable layout
│   │   ├── dashboard/                  # Book library & ZIP import
│   │   └── layout.tsx
│   ├── components/
│   │   ├── cover/                      # Cover designer canvas and controls
│   │   ├── dashboard/                  # BookCard component with actions
│   │   ├── editor/                     # Markdown editor with live preview
│   │   ├── preview/                    # Book preview viewer
│   │   └── sidebar/                    # Navigation and chapter management
│   └── lib/
│       ├── books.ts                    # Core business logic (CRUD, duplicate, ZIP)
│       └── db/                         # Drizzle schema and connection
├── tests/                              # Integration & unit test suites
├── drizzle.config.ts                   # Drizzle Kit configuration
├── vitest.config.ts                    # Vitest runner configuration
└── PLAN.md                             # Architectural blueprint & roadmap
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.
