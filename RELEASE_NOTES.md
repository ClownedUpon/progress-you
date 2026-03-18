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
