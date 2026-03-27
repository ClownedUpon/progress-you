## v2.7.0 — Tally Trackers, Reminders & Dashboard Control

**Tally trackers**
Trackers now support two modes: **Habit** (binary daily check) and **Tally** (count occurrences per day). Create a tally tracker for things like glasses of water, coffees, or workouts. Tally trackers show +/- buttons everywhere — Today dashboard, Trackers view, and monthly calendar. Left-click increments, right-click decrements. The tracker creation modal lets you choose between Habit and Tally mode.

**Quick Capture reminders**
The Quick Capture modal (Ctrl+Space) now includes an optional reminder toggle for tasks. Set a date and time, and the app will fire a desktop notification when it's due.

**Priority highlighting**
High-priority tasks in the Upcoming Digest now stand out with a red-tinted background, bold title, and ↑ arrow. Low-priority tasks are visually de-emphasized.

**Date-based task scheduling**
The Schedule Task modal now has a "Pick a Date" mode in addition to "This Week." Choose any date and the task is placed as a timetable block in the correct week, even if you're not currently viewing that week.

**Full task editing in side panel**
The TaskPanel (right-side navigation drawer) now supports full editing: section, priority, status, due date, reminder with date+time, and full checklist CRUD — matching the capabilities of the standalone task edit modal.

**Rearrangeable Today dashboard**
The Today view now has an "Arrange" button that lets you reorder sections (Upcoming, Trackers, Schedule) with up/down arrows. Your preferred order persists across sessions.

**Pre-release cleanup**
- Seed data now includes tally tracker examples ("Drink Water" and "Coffees")
- Export version bumped to v8 for the new tracker `mode` field
- Fixed HTML entity rendering issues in UI text

---

## v2.6.0 — QoL Polish

**Responsive header**
The top navigation bar now wraps gracefully at any window width — no more horizontal scrollbar. Button labels collapse at narrow widths, and right-side buttons always stay anchored to the right edge.

**Pinned note overlay**
Pin any note as a floating, draggable overlay — independent of the Today pin. The note stays visible while you navigate between views. Includes a link button to jump to the full note editor.

**Set block management**
Set blocks (recurring timetable templates) can now be reordered via right-click context menu and deleted. Drag-to-place is supported with a visual highlight on the target slot.

**Tracker deletion and archiving**
Trackers can now be deleted (with in-app confirmation dialog) or archived. Archived trackers are hidden from the daily view but preserved in data. An "Archived" toggle in the Trackers view reveals them.

**Template delete confirmation**
Deleting a week template now shows a confirmation dialog instead of removing it immediately.

**Break/buffer linked items**
Timetable break and buffer blocks now display their linked items, matching the behavior of regular section blocks.

---

## v2.5.0 — Rich Note Editor

**Tiptap-powered editor**
The note editor has been completely rebuilt on Tiptap (ProseMirror), replacing the basic contentEditable implementation. The new editor supports:

- **Text formatting**: Bold, Italic, Underline, Strikethrough, Code, Subscript, Superscript
- **Block types**: Headings (H1–H3), Bullet/Ordered/Task lists, Blockquotes, Code blocks, Horizontal rules
- **Rich features**: Highlight, Text alignment (left/center/right/justify), Font size, Font color, Tables
- **Custom nodes**: Callout blocks, Collapsible sections, Date chips, Task chips, Inline images

**Double-row toolbar with tooltips**
A two-row toolbar provides quick access to all formatting options. Every button has a CSS tooltip showing its name and keyboard shortcut on hover.

**Slash commands**
Type `/` in the editor to access a command palette for inserting blocks, callouts, collapsibles, tables, horizontal rules, and more.

**Image support**
Images can be inserted into notes and are stored as inline base64 data URIs — no external file dependencies. Images support resize handles and drag repositioning.

**Collapsible sections**
Create expandable/collapsible content blocks within notes. Click the arrow to toggle, or the X to remove.

---

## v2.4.0 — New User Experience

**Seed data**
New installations now launch with pre-populated demo data across all features — sample tasks, notes, timetable blocks, and trackers — so new users can immediately see how the app works instead of facing blank screens.

**Load Demo button**
A "Load Demo Data" button in Settings → App lets existing users load the demo dataset at any time to explore features or reset to a known state.

---

## v2.3.0 — Multi-File Architecture

**Modular source split**
The single 5,200-line `index.html` has been split into 6 focused JSX modules under `src/app/`. The HTML shell (`index.html`, 81 lines) fetches and concatenates them at runtime before Babel compilation — no build step added. Each file has a clear responsibility:

| File | Role |
|------|------|
| `01-core.jsx` | Helpers, constants, storage, migrations, styles |
| `02-shared.jsx` | Reusable UI components (ColorPicker, TimePicker, Overlay, etc.) |
| `03-modals.jsx` | All modal dialogs (Search, BlockModal, TaskEdit, Settings, etc.) |
| `04-views.jsx` | All top-level views (Today, Timetable, Boards, Notes, Trackers, Stats) |
| `05-overlays.jsx` | Side panels and overlays (NavOverlay, PinOverlay, TaskPanel, NotePanel) |
| `06-app.jsx` | ErrorBoundary, App component, render call |

This improves developer experience and makes LLM-assisted editing significantly more efficient — only the relevant 300–2,000 line file needs to be read instead of the full 5,000+ line monolith.

**No functional changes** — the app behaves identically to v2.2.0.

---

## v2.2.0 — Trackers, Search & Quality of Life

**Trackers — new top-level feature**
A brand-new Trackers tab for tracking recurring habits and routines. Create trackers with custom active days (e.g. Mon–Fri), tick them off daily, and watch your streak grow. Each tracker has a weekly completion grid, monthly calendar view, and streak counter. Trackers are fully interconnected — pin tasks and notes to a tracker, link trackers to timetable blocks, and create new tasks or notes directly from a tracker's detail panel. Today's active trackers also appear on the Today dashboard and the Pin Overlay for quick access.

**Global search (Ctrl+K)**
Search across tasks, notes, timetable blocks, and trackers from anywhere in the app. Results are grouped by type with color-coded badges. Supports regex patterns for power users. Archived items are excluded from results.

**Undo toasts**
Destructive actions (deleting or archiving tasks, notes, trackers) now show a 5-second undo toast at the bottom of the screen. Up to 5 actions are tracked in parallel.

**Task archiving**
Done tasks can be archived from the taskboard to keep boards clean. Archived tasks remain accessible through search, the Log view, and linked items.

**Data overview in Stats**
The Stats view now includes a data overview card showing total counts, creation dates, and per-section breakdowns for tasks, notes, and timetable data. A Tracker Consistency card shows weekly completion rates with progress bars.

**Import/Export v7**
Trackers are included in full data exports and imports. Export version bumped to 7.

**TimePicker portal dropdown**
The time picker dial now renders as a floating portal above all overlays, eliminating clipping and scroll issues when setting times in the Block editor.

**Under the hood**
- Migration functions use safe `...spread` then `?? default` ordering
- Timetable data auto-prunes weeks older than 6 months (archived to `py-tt-archive`)
- `uid()` uses `crypto.getRandomValues()` instead of `Math.random()`
- Tasks and notes gain `linkedTrackerIds` field via migrations
- Priority picker added to Add Task modal and tracker task creation
- Pin Existing search dropdowns close on outside click

---

## v2.0.2 — Offline & Data Safety

**Offline-first loading**
React, ReactDOM, and Babel are now bundled locally in `src/vendor/`. The app no longer requires an internet connection to launch. Fonts are also served from local woff2 files. A CDN fallback is retained for dev mode only.

**Automatic backups**
Your data is now backed up automatically (default: every 24 hours). Backups are stored alongside your data in `AppData/backups/`, with the 10 most recent sets retained. The interval is configurable in Settings → App (minimum 1 hour, maximum 7 days), and a manual "Backup Now" button is available.

**Safe section removal**
Deleting a section now shows a confirmation overlay with a count of affected tasks, notes, and timetable blocks. You can choose to migrate all items to another section or delete them permanently. The last remaining section cannot be removed.

**Error boundary**
If a component crashes, the app now shows a recovery screen with the error details and a Refresh button instead of a blank white screen. Your data is unaffected.

**Debounced writes**
Rapid state changes (e.g. dragging tasks between columns) are now coalesced into a single disk write per data key, reducing filesystem load.

**Bugfix**
Fixed an undefined `setAdding()` call in BoardsView that could crash the app when switching section tabs.
