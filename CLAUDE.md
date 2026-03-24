# Progress You — CLAUDE.md

## Project Overview
Progress You is a Tauri v2 desktop productivity app — a personal notebook system with timetabling, task management, notes, calendar, and statistics views. It is built for a single user on Windows, runs fully offline, and stores all data locally.

## Philosophy
Pure function, no fuss or flash. Two core principles:
1. **Data agency** — the user owns and controls all their data. Local storage only, full import/export, automatic backups.
2. **Total interconnectivity** — tasks, notes, timetable blocks, and calendar entries all link to each other. Every item is reachable from every relevant context.

## Stack
- **Tauri v2** (Rust backend) + **vanilla React 18** via local vendor bundle + **Babel 7.23.2** standalone — no build step
- Frontend entry: `src/index.html` (81-line HTML shell + script loader)
- App source: `src/app/` — 6 JSX files fetched, concatenated, and Babel-compiled at runtime
- Vendor libs: `src/vendor/` (react, react-dom, babel, fonts)
- Data stored via `tauri-plugin-fs` in `AppData/Roaming/com.progressyou.desktop/`
- Rust files: `src-tauri/src/main.rs`, `src-tauri/build.rs`, `src-tauri/Cargo.toml`
- Capabilities: `src-tauri/capabilities/default.json`

## App Source Files (`src/app/`)
| File | Contents |
|------|----------|
| `01-core.jsx` | React destructuring, contexts, constants, helpers, storage, migrations, styles |
| `02-shared.jsx` | Micro components (Dot, Badge, Cap, Pill, Empty, Overlay), ColorPicker, TimePicker, ContextMenu, AppDialog |
| `03-modals.jsx` | QuickCapture, Search, Schedule, ImportExport, Block, Template, AddTask, TaskEdit, SectionDelete, UpdateDialog |
| `04-views.jsx` | TodayView, TimetableView, BoardsView, NotesView, TrackersView, MonthlyView, StatsView, TrackerCreateModal, SettingsModal |
| `05-overlays.jsx` | TrackerNavPanel, NavOverlay, NoteDeleteOverlay, TaskPanel, NotePanel, PinOverlay |
| `06-app.jsx` | ErrorBoundary, App component, ReactDOM.createRoot render call |

Files are loaded in numeric order — components must be defined before they are referenced (06-app.jsx references all others).

## Cargo Dependencies
`tauri` (tray-icon), `tauri-plugin-fs`, `tauri-plugin-dialog`, `tauri-plugin-notification`, `tauri-plugin-autostart`, `tauri-plugin-updater`, `tauri-plugin-opener`, `serde`, `serde_json`

## Storage Keys
Filesystem (AppData JSON files): `py-sections`, `py-tt`, `py-tasks`, `py-notes`, `py-trackers`, `py-tt-templates`, `py-tt-setblocks`, `py-tt-archive`, `py-export-path`, `py-skipped-version`, `py-backup-meta`, `py-backup-interval`
SessionStorage: `py-cap-type`, `py-cap-sec`, `py-time-12h`, `py-recent-colors`

## Views (top nav)
Today · Timetable · Taskboards · Notes · Trackers · Calendar · Log · Stats

## Key Architecture
- `NavCtx` — React context providing `navigateTo`, `navigateToFresh`, `navigateBack`, `navigateToDate`, `navStack`, `navigateToIndex`, `setView`, `getDayBlocks`, `upsertBlock`, `sections`
- `CtxMenuCtx` — provides `openCtx(e, items)` for right-click menus
- `NavOverlay` — right-side drawer with breadcrumb trail; `TaskPanel` and `NotePanel` inside
- `PinOverlay` — floating always-on-top dashboard panel showing today's schedule + active tasks
- `ErrorBoundary` — class component wrapping `<App/>`, catches render errors with recovery UI

## Data Schemas
**Task:** `{id, sectionId, title, notes, type, status, order, priority, checklist[], linkedNoteIds[], linkedTrackerIds[], dueDate, dueTime, allDay, remindAt, remindFired, archived, createdAt, completedAt, monthCompleted}`
**Note:** `{id, parentId, title, content, order, createdAt, tags[], linkedTaskIds[], linkedTrackerIds[], remindAt, remindFired}`
**Block:** `{id, type, sectionId, label, start, end, linkedItems[{type, id, snapshot}]}`
**Template:** `{id, name, color, blocks: {Monday:[…], …}}`
**Tracker:** `{id, title, sectionId, color, activeDays[7], completions{}, linkedTaskIds[], linkedNoteIds[], order, archived, createdAt}`

## Key Components
`TodayView`, `TimetableView`, `BoardsView`, `NotesView`, `TrackersView`, `MonthlyView` (Calendar+Log tabs), `StatsView`, `TaskCard`, `TaskEditModal`, `ScheduleTaskModal`, `BlockModal`, `TemplateModal`, `NoteEditor`, `NavOverlay`, `TaskPanel`, `NotePanel`, `TrackerNavPanel`, `PinOverlay`, `TimePicker` (radial, 12h/24h, portal dropdown), `ColorPicker` (presets + recent + custom), `QuickCaptureModal`, `ImportExportModal`, `SettingsModal`, `TrackerCreateModal`, `SectionDeleteOverlay`

## Rust Commands
`app_version`, `fire_notification`, `check_update`, `install_update`

## Storage Functions
- `sget(key)` — read JSON file from AppData
- `sset(key, value)` — write JSON file to AppData (immediate)
- `ssetDebounced(key, value, delay=800)` — debounced write, used by all useEffect persistence watchers
- `runBackupIfDue(force)` — automatic backup to `AppData/backups/`, configurable interval

## Babel/Escape Constraints — STRICTLY OBSERVED
These constraints are non-negotiable. Violating them will break the app at compile time with no useful error message.
- **No `\u{XXXXX}` syntax** — use `&#x...;` HTML entities or literal characters instead
- **No `\NNN` octal escapes** in template literals
- **No `await`** inside non-`async` functions
- **No `React.useContext`** calls inside IIFEs or inline expressions — always at component top level
- **No IIFEs returning JSX** inside `.map()` callbacks — hoist variables before `return`

## Script Loading
`index.html` uses a resilient async loader: tries `./vendor/*.min.js` first (offline), falls back to CDN (dev mode only), shows a visible error if both fail. After vendors load, it fetches all 6 `src/app/*.jsx` files via `fetch()`, concatenates them in order, and compiles via `Babel.transform()` with presets `['env', 'react']`.

## Current Version
2.6.0

## Release Process
```
git add . && git commit -m "message"
git push
git tag vX.Y.Z
git push --tags
```
The GitHub Actions workflow in `.github/workflows/release.yml` builds the MSI, signs it, and creates a draft release with updater JSON.

## Planned Work
- Phase 2 Mobile (deferred): Tauri mobile target + LAN sync
- Node.js deprecation: `actions/checkout@v4` and `actions/setup-node@v4` will drop Node 20 before June 2026 — update CI before then
- Babel "Script error" in dev — does not affect production, cause not yet isolated

## How to Work on This Project
1. Read the relevant `src/app/*.jsx` file before making changes — use the table above to find the right file
2. Test all changes with `npm run tauri dev`
3. New components go in the appropriate file by category (shared → 02, modal → 03, view → 04, overlay → 05)
4. Respect the Babel constraints above — they are the most common source of silent breakage
5. When editing styles, follow the existing design system: warm earth tones (#F8F3EC background, #1C1714 dark, #EBE4D8 muted, Playfair Display for headings, DM Sans for body)
6. All new data fields must be added to the relevant migration function (`migrateTasks`, `migrateNotes`, `migrateTt`, `migrateTrackers`) with `??` defaults so existing data isn't broken
7. Components must be defined before they are referenced — file load order is 01 through 06
8. Always merge worktree branches into `main` so that `npm run tauri dev` picks up changes immediately — CI workflow safeguards prevent bad builds from shipping
