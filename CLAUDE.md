# Progress You — CLAUDE.md

## Project Overview
Progress You is a Tauri v2 desktop productivity app — a personal notebook system with timetabling, task management, notes, calendar, and statistics views. It is built for a single user on Windows, runs fully offline, and stores all data locally.

## Philosophy
Pure function, no fuss or flash. Two core principles:
1. **Data agency** — the user owns and controls all their data. Local storage only, full import/export, automatic backups.
2. **Total interconnectivity** — tasks, notes, timetable blocks, and calendar entries all link to each other. Every item is reachable from every relevant context.

## Stack
- **Tauri v2** (Rust backend) + **vanilla React 18** via local vendor bundle + **Babel 7.23.2** standalone — no build step
- Single frontend file: `src/index.html` (~4000 lines)
- Vendor libs: `src/vendor/` (react, react-dom, babel, fonts)
- Data stored via `tauri-plugin-fs` in `AppData/Roaming/com.progressyou.desktop/`
- Rust files: `src-tauri/src/main.rs`, `src-tauri/build.rs`, `src-tauri/Cargo.toml`
- Capabilities: `src-tauri/capabilities/default.json`

## Cargo Dependencies
`tauri` (tray-icon), `tauri-plugin-fs`, `tauri-plugin-dialog`, `tauri-plugin-notification`, `tauri-plugin-autostart`, `tauri-plugin-updater`, `tauri-plugin-opener`, `serde`, `serde_json`

## Storage Keys
Filesystem (AppData JSON files): `py-sections`, `py-tt`, `py-tasks`, `py-notes`, `py-tt-templates`, `py-tt-setblocks`, `py-export-path`, `py-skipped-version`, `py-backup-meta`, `py-backup-interval`
SessionStorage: `py-cap-type`, `py-cap-sec`, `py-time-12h`, `py-recent-colors`

## Views (top nav)
Today · Timetable · Taskboards · Notes · Calendar · Log · Stats

## Key Architecture
- `NavCtx` — React context providing `navigateTo`, `navigateToFresh`, `navigateBack`, `navigateToDate`, `navStack`, `navigateToIndex`, `setView`, `getDayBlocks`, `upsertBlock`, `sections`
- `CtxMenuCtx` — provides `openCtx(e, items)` for right-click menus
- `NavOverlay` — right-side drawer with breadcrumb trail; `TaskPanel` and `NotePanel` inside
- `PinOverlay` — floating always-on-top dashboard panel showing today's schedule + active tasks
- `ErrorBoundary` — class component wrapping `<App/>`, catches render errors with recovery UI

## Data Schemas
**Task:** `{id, sectionId, title, notes, type, status, order, priority, checklist[], linkedNoteIds[], dueDate, dueTime, allDay, remindAt, remindFired, createdAt, completedAt, monthCompleted}`
**Note:** `{id, parentId, title, content, order, createdAt, tags[], linkedTaskIds[], remindAt, remindFired}`
**Block:** `{id, type, sectionId, label, start, end, linkedItems[{type, id, snapshot}]}`
**Template:** `{id, name, color, blocks: {Monday:[…], …}}`

## Key Components
`TodayView`, `TimetableView`, `BoardsView`, `NotesView`, `MonthlyView` (Calendar+Log tabs), `StatsView`, `TaskCard`, `TaskEditModal`, `ScheduleTaskModal`, `BlockModal`, `TemplateModal`, `NoteEditor`, `NavOverlay`, `TaskPanel`, `NotePanel`, `PinOverlay`, `TimePicker` (radial, 12h/24h), `ColorPicker` (presets + recent + custom), `QuickCaptureModal`, `ImportExportModal`, `SettingsModal`, `SectionDeleteOverlay`

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
- **No `</script>` literal** inside the app source (it's in a `type="text/plain"` tag) — use string concatenation if needed

## Script Loading
`index.html` uses a resilient async loader: tries `./vendor/*.min.js` first (offline), falls back to CDN (dev mode only), shows a visible error if both fail. The app source is in a `<script id="app-source" type="text/plain">` tag, manually compiled via `Babel.transform()` with presets `['env', 'react']`.

## Current Version
2.0.2

## Release Process
```
git add . && git commit -m "message"
git push
git tag v2.0.2
git push --tags
```
The GitHub Actions workflow in `.github/workflows/release.yml` builds the MSI, signs it, and creates a draft release with updater JSON.

## Planned Work
- Phase 2 Mobile (deferred): Tauri mobile target + LAN sync
- Node.js deprecation: `actions/checkout@v4` and `actions/setup-node@v4` will drop Node 20 before June 2026 — update CI before then
- Babel "Script error" in dev — does not affect production, cause not yet isolated
- Global search (Ctrl+K) across tasks, notes, and blocks
- Undo toast for destructive actions (5-second window)
- Archive vs. delete for completed tasks
- Timetable data pruning (old weeks grow unbounded)

## How to Work on This Project
1. Read the relevant section of `src/index.html` before making changes — the file is ~4000 lines, don't assume structure
2. Test all changes with `npm run tauri dev`
3. Keep everything in a single `index.html` file — do not split into multiple files
4. Respect the Babel constraints above — they are the most common source of silent breakage
5. When editing styles, follow the existing design system: warm earth tones (#F8F3EC background, #1C1714 dark, #EBE4D8 muted, Playfair Display for headings, DM Sans for body)
6. All new data fields must be added to the relevant migration function (`migrateTasks`, `migrateNotes`, `migrateTt`) with `??` defaults so existing data isn't broken
