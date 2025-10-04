## 9‑Box Talent App — MVP PRD

### 1) Problem & goals

Leaders need a fast, consistent way to assess people on Performance and Potential, place them in a 9‑box, and see department and company‑wide distributions—without spreadsheets or meetings chaos.

- **Primary goals**
  - **Simple import & setup** of employees per department.
  - **Frictionless placement** into the 9‑box (drag‑and‑drop or quick select).
  - **Roll‑up view** that aggregates multiple departments into one company snapshot.
  - **Clear export** for sharing.

- **Non‑goals (MVP)**
  - HRIS integration, single sign‑on, historical trend lines, comments/annotations, calibration workflows.

### 2) Users & permissions
- **Org Admin**: creates org, manages box definitions & departments; full access.
- **Department Manager**: can view/edit people in their departments; sees company roll‑up (read‑only for other depts).
- **Viewer (optional)**: read‑only access to roll‑up.

### 3) Core user stories (MVP)

1. **Import people**
   - As an Admin/Manager, I upload a CSV or paste a list to create/update employees.
   - The app validates columns, lets me map headers, shows a preview, and merges by Employee ID (preferred) or Email.

2. **Define departments**
   - As an Admin, I add/edit departments and (optionally) assign a color used in roll‑up visuals.

3. **Assess**
   - As a Manager, I can:
     - Drag each person tile into a 9‑box cell, or
     - Select Performance (Low/Med/High) and Potential (Low/Med/High) and have the system place them automatically.
     - (Optional) assign a department and a short note.

4. **Review & share**
   - As a Manager/Admin, I see a department legend, each box’s members (color‑coded by department), and a distribution summary (counts and %).
   - I can export CSV (flat table) and HTML/PNG (visual snapshot).

Reference: use the 4‑step flow (Team Setup → Departments → Assessment → Review), department color legend, dual assessment modes, and export options.

### 4) 9‑box model (MVP default; replace with Sonance definitions)

Orientation: X‑axis = Performance (Low → High), Y‑axis = Potential (Low → High).

| Key        | Label (default)        | Short description                          | Default action hint                 |
|------------|-------------------------|--------------------------------------------|-------------------------------------|
| low/low    | Realign & Redirect      | Not delivering; can’t adapt                 | Realign or exit 3–6 mo              |
| med/low    | Core Foundation         | Solid; limited potential                    | Focus, motivate, retain             |
| high/low   | Master Craftsperson     | Expert; right level                         | Retain; mentor others               |
| low/med    | Evaluate Further        | Potential present; not meeting              | Improve or move 6 mo                |
| med/med    | Steady Contributor      | Reliable; meets                             | Engage & retain                     |
| high/med   | Performance Leader      | Exceptional results                         | Challenge; promote ≤24 mo           |
| low/high   | Rising Talent           | Underperforming; high potential             | Coach to performance ≤6 mo          |
| med/high   | Emerging Leader         | Meets; ready for more                       | Develop; promote ≤24 mo             |
| high/high  | Star / Top Talent       | Exceeds; fast learner                       | Challenge; promote ≤12 mo           |

Action items: Replace labels/descriptions/actions with Sonance‑specific definitions. Include color per box if desired.

### 5) UX & interaction (MVP)
- **Layout**: 3×3 responsive grid; each cell shows title, hint, and a scrollable list of assigned people.
- **Person tile**: name, (optional) dept color strip, and hover menu with “Move”, “Edit”, “Remove from box”.
- **Drag‑and‑drop**: HTML5 DnD on desktop; long‑press drag on mobile. Keyboard: Space (pick), arrows (navigate cell), Enter (drop).
- **Dual input modes**:
  - Drag into grid
  - Radio selects for perf/potential or direct box picker
- **Filters**: by Department, Manager, Location (if provided); search by name.
- **Company view**: select multiple departments → combined grid with department color coding + distribution summary (counts + %). Toggle “show dept tags”.

### 6) Data model (proposed)
- **Employee**: id*, name*, email, department_id, manager_name/id, title, location.
- **Department**: id*, name*, color.
- **Assessment**: id*, employee_id*, performance ∈ {low,medium,high}, potential ∈ {low,medium,high}, box_key (derived), note, assessed_by, assessed_at.
- **BoxDefinition**: key* (e.g., star, performance…), label, description, action_hint, color, grid_position (x,y).

Derivations
- `box_key` computed from `(performance,potential)` via mapping table; can also be set directly when the user picks a box.

### 7) CSV import/export (MVP)

**Import**
- Accept `.csv` with headers: `employee_id, name, email, department, manager, title, performance, potential`.
- Flexible mapping UI: users can map their column names to expected fields.
- Validation: missing name or employee_id flagged; invalid perf/potential values mapped via dropdown or rejected with inline fix.
- Deduping: merge on `employee_id` (or `email` if ID missing).

**Export**
- CSV: `name, employee_id, department, performance, potential, box_label, assessed_by, assessed_at`.
- HTML/PNG: visual snapshot of the grid + legend and summary.

### 8) Accessibility & responsiveness
- WCAG AA: keyboard DnD, focus rings, ARIA roles for grid and draggable tiles.
- Works on modern desktop + mobile browsers; no horizontal scrolling.

### 9) Performance & limits (MVP)
- Smooth DnD and filtering up to 1,000 employees per org (virtualized lists).
- Company view renders with lazy mounting; box cell lists virtualized beyond 50 items.

### 10) Security & privacy (MVP)
- App stores name/email/title only (no comp or sensitive PII).
- Role‑based access on endpoints; server‑side validation.
- Basic auth for MVP; SSO planned for Phase 2.

### 11) Tech notes (suggested)
- Front‑end: React (or Vue) + HTML5 DnD; design tokens for Sonance brand.
- Back‑end: Lightweight REST (Node/Express) or serverless functions.
- Storage: Postgres (or Supabase) schemas matching the data model; file uploads to object storage.
- Testing: Cypress (happy path: import → place → roll‑up → export).

### 12) Acceptance criteria (MVP)
- **Import**: Given a valid CSV with ≥1 employee, after mapping columns I can preview and import; duplicates update existing records; I see an “Import complete” summary with counts.
- **Place by drag**: I can drag a person into any cell; the person’s performance/potential and `box_key` update instantly; undo (Ctrl/Cmd+Z) reverts the last move.
- **Place by select**: Choosing perf/potential moves the person to the correct cell automatically; switching to direct box selection updates perf/potential via mapping.
- **Department link‑up**: Selecting multiple departments shows a combined grid with colored dept strips on each person; counts and % update accordingly.
- **Filters & search**: Filtering by department or searching by name updates all cells without page reload.
- **Export**: I can export CSV (flat table) and an HTML/PNG snapshot that matches the on‑screen grid and legend.
- **Persistence**: Refreshing the page restores the latest placements.
- **A11y**: All core actions are keyboard‑operable.

### 13) Phase 2 (later)
- Calibration session mode (multi‑manager live view).
- Comments & development actions per person.
- Snapshots & trends over time.
- SSO (Google/Microsoft), HRIS import (BambooHR, Workday).
- Custom rating scales (5‑point), custom axes labels.
- Fine‑grained permissions (e.g., hide people across peer departments).

—

If needed, drop Sonance‑specific labels and colors into the 9‑box definitions above.

