
## v2.0.0

This release is a comprehensive rewrite of the data layer, UI system, and cross-system navigation. Every view gained new functionality. The Rust backend gained three new plugins. The export system was redesigned.

---

### Phase 1 — Data Foundation

**Task schema additions**
- `order` — integer for manual drag-and-drop reordering within a section column
- `priority` — replaces the old `pinned` boolean; values are `high`, `normal`, `low`
- `checklist` — array of `{id, text, done}` items per task
- `linkedNoteIds` — array of note IDs linking tasks to notes bidirectionally
- `dueTime` — optional HH:MM string for time-of-day due times
- `allDay` — boolean; when false, `dueTime` is shown alongside the date
- `remindAt` — ISO datetime string for scheduled reminders
- `remindFired` — boolean; tracks whether a reminder has already fired without clearing the date

**Note schema additions**
- `tags` — array of lowercase tag strings
- `linkedTaskIds` — array of task IDs linking notes to tasks bidirectionally
- `remindAt` / `remindFired` — same reminder fields as tasks

**Migration**
- `migrateTasks()` and `migrateNotes()` run on every load to fill missing fields with defaults, ensuring all existing data is compatible without manual intervention
- `migrateTt()` upgrades timetable blocks from the old singular `linkedTaskId`/`linkedNoteId` fields to the new `linkedItems[]` array

---

### Phase 2 — Taskboard Enhancements

**Drag and drop**
- Drag uses pointer events; inserting to the top or bottom half of a card places before or after it respectively
- Order field renumbered across the section after every drop

**Priority**
- Priority badges (↑ High, ↓ Low) on cards; Normal shows nothing
- Priority submenu in context menu; priority sort toggle on board header

**AddTaskModal**
- Full overlay for adding tasks with title, notes, status picker, due date, and checklist builder

**TaskCard expanded body**
- Tickable inline checklist with progress chip
- Due date with all-day / time-of-day toggle
- Linked notes chips navigating the drawer
- Note picker with search
- Reminder datetime field

---

### Phase 3 — Notes Enhancements

**Rich content toolbar**
- Callout block (amber left-border)
- Collapsible sections with editable title and body; saved always closed
- Date chips — clickable, navigate to timetable week
- Task chips — link to task, add to `linkedTaskIds`
- Image insert via Tauri file dialog; path stored, src stripped on save
- Text colour with swatch grid and custom picker

**Tags**
- Tag chips below title; suggestion dropdown from existing section tags
- Sidebar tag filter with AND/OR toggle

---

### Phase 4 — Cross-System Navigation & Today Dashboard

**NavCtx**
- React context providing `navigateTo`, `navigateToFresh`, `navigateBack`, `navigateToDate`, `navStack`, `setView`, `getDayBlocks`, `upsertBlock`, `sections` to all components

**NavOverlay drawer**
- Right-side panel with breadcrumb trail
- `navigateTo` pushes; `navigateToFresh` replaces the stack (used by PinOverlay)
- Breadcrumb items clickable to pop back

**TaskPanel**
- Inline edit mode (title, notes, status), tickable checklist, linked notes, mark done, Go to board, Schedule

**NotePanel**
- Full rich content with interactive chips, Go to note button

**Wired click-throughs**
- MiniCol task titles, UpcomingDigest tasks, TaskCard note chips, NoteEditor date/task chips, Calendar tasks all navigate via the drawer

---

### Phase 5 — Timetable Enhancements

**Week templates**
- Named, coloured 7-day templates stored in `py-tt-templates`
- TemplateModal mini week grid editor
- Apply with Replace or Merge; empty weeks skip the confirmation

**Set block palette**
- Per-block reusable snippets stored in `py-tt-setblocks`
- Save from BlockModal or context menu; drag from palette to any day column with insert position detection
- Individual remove button per palette entry

**Block enhancements**
- `linkedItems[]` replaces singular task/note fields; multiple items per block
- Linked items shown as clickable chips; dead links show snapshot with "(removed)"

**Smart default time**
- New block Start defaults to end of last existing block on that day; End defaults to +90 minutes

**Block height by duration**
- Height scales with duration: clamp(36px, minutes × 0.7, 160px)

---

### Phase 6 — Calendar Month View & Reminders

**Calendar view (new top-level tab)**
- Month grid, Monday-first, with navigation and Today shortcut
- All tasks with a due date shown regardless of status; active in section colour, completed in green strikethrough
- Today highlighted in amber; clicking a day number navigates timetable to that week

**Log view**
- Previous Monthly tab preserved as Log

**Reminders**
- Engine polls every 15 seconds; fires native OS notification via `tauri-plugin-notification`
- In-app toast banner as always-visible fallback; slides in bottom-right, auto-dismisses after 6 seconds
- `remindFired` flag preserves the date after firing; field turns green and shows "Reminded"
- Reminder fields in TaskCard and NoteEditor

---

### Phase 7 — System & Export Polish

**Customizable export**
- Tabbed Export / Import modal
- Per-type checkboxes (Sections, Tasks, Timetable, Notes)
- Task filter: per-section and created date range
- Note filter: per-section
- Native save-as file dialog via `tauri-plugin-dialog`; last path remembered
- Success toast confirms filename

**Pin overlay**
- Floating always-visible panel toggled by 📌 Pin button in header
- Draggable; shows today's schedule and active tasks from live React state
- Task chips use `navigateToFresh` to avoid stacking breadcrumbs

---

### Additional polish

**TaskCard redesign**
- Click = compact peek of non-default properties only (notes, checklist, due date, reminder, linked notes)
- Full edit form moved to `TaskEditModal` overlay via right-click → Edit or Edit button
- Context menu and peek strip include 📅 Schedule

**ScheduleTaskModal**
- Schedule a task to a timetable block from the drawer or taskboard
- Day picker, start/end via radial time picker; smart pre-fill from last block on chosen day

**Radial TimePicker**
- Replaces native time inputs in BlockModal and ScheduleTaskModal
- Hour dial: outer ring 1–12, inner ring 13–23/0; selecting hour advances to minute dial
- Minute dial: radial clock, :00–:55 in 5-minute steps
- 12h/24h toggle persisted in sessionStorage; 12h mode shows AM/PM buttons; stored value always 24h

**Unified ColorPicker**
- Single component used in SettingsModal, TemplateModal, and NoteEditor text colour toolbar
- Preset swatches, up to 6 recent colours (persisted in sessionStorage), native OS picker, hex text input

**Note delete confirmation**
- Inline red banner replaced with centred overlay modal; states clearly whether sub-notes will also be deleted

**Quick Capture**
- Remembers last used type (task/note) and section across the session
- Task capture now includes status, priority, due date, and checklist builder

**Keyboard fixes**
- F3 (browser find) and F7 (caret browsing) suppressed inside the app window

**Boardsview section memory**
- Switching away and back restores the previously selected section

**Build**
- `build.rs` triggers recompile when `src/index.html` changes
- `tauri-plugin-notification` and `tauri-plugin-dialog` added
- `capabilities/default.json` updated with all required permissions
- Context menu suppressed only in production; right-click → Inspect works in `tauri dev`