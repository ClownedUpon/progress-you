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
