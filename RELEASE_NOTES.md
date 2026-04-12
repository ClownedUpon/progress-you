## v3.0.2 — Tracker Overhaul: Five Types, Charts & Cell Editing

**Five tracker types**
Trackers now support habits (daily yes/no), tallies (count occurrences), ratings (scale e.g. mood 1–5), measures (number + unit e.g. weight in kg), and choices (pick from a custom list e.g. weather). Each type has its own inline controls in every surface: Trackers view, Today view, Pin overlay, and Nav panel.

**SVG trend charts**
The detail panel now shows a type-aware chart below the month grid: a polyline trend chart with average line for ratings and measures (with 30d/90d/All period selector), a GitHub-style 12-week activity heatmap for habits and tallies, and a horizontal bar distribution chart for choices.

**Month grid redesign**
Calendar cells now show the day number tucked in the top-left corner with the tracked value displayed large and coloured in the centre — making it easy to distinguish dates from data at a glance.

**Cell edit popover**
Clicking a past-date cell in the month grid opens a type-aware editor overlay: numbered dots for ratings, a number input for measures, coloured option pills for choices, and +/− buttons for tallies. Each popover includes a Clear button to remove entries.

**Mode change warning**
Editing a tracker's type now shows a warning when existing completion data might be incompatible, with an option to clear the data before saving.

**CSV export**
Export any tracker's full completion history as a CSV file from the detail panel header. Uses Tauri's native save dialog with a browser blob fallback.

**Enhanced stats**
The Stats view now shows type-specific metrics: weekly rate + streak for habits/tallies, weekly average + trend arrow for ratings, average + range + trend for measures, and most frequent pick for choices.

**Demo & tutorial updates**
Seed data and showcase data now include all five tracker types with realistic historical completions. The walkthrough tour step and per-view help card reflect the expanded feature set.

---

## v3.0.0 — Onboarding, Help System & Showcase

**First-launch experience**
New installations now show a Welcome screen with two paths: **Take the Tour** loads a rich showcase workspace and walks you through every feature in an 11-step guided walkthrough, or **Start Fresh** to begin with a blank slate. The tour highlights the nav bar, each view, Quick Capture, Search, pin overlays, and Settings — with positioned tooltip bubbles and a backdrop cutout around each target element. Keyboard support: Enter/→ for Next, Escape to Skip.

**Showcase dataset**
A full "week in the life" demo workspace purpose-built for screenshots and the tour: 20 tasks with real descriptions and checklists, 10 notes with Tiptap content (callouts, collapsibles, tables, task/date chips), 6 trackers with 4 weeks of historical data, a complete Mon–Sun timetable across 2 weeks, and cross-links everywhere. Available anytime via Settings → Load Showcase.

**Per-view help cards**
A `?` button in the bottom-left corner opens a help panel for whichever view you're on — summary, key actions, and keyboard shortcuts. Calendar and Log have separate help entries.

**Enriched empty states**
Empty views now show bullet-point guidance instead of just a message, helping new users discover features at the point of need.

**Timetable dates**
Day columns now show the date (e.g. "Monday 7 Apr") and today's column is highlighted in gold.

**New note auto-select**
Creating a note via + Note, + Child, context menu, or duplicate now immediately opens it in the editor.

**Data safety warnings**
Load Demo, Load Showcase, and Restart Tour now show a red-titled confirmation overlay warning that existing data will be replaced, with a "Backup First" option.

**Section color picker scroll**
The sections list in Settings now scrolls within a fixed container, keeping all color pickers accessible regardless of section count.

**Note picker close-on-click-outside**
The Pin a Note dropdown now closes when clicking anywhere outside it.
