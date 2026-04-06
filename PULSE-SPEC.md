# Pulse - Spec for Claude Code

> A shared team task manager + infinite canvas for KPF Applied Technology.
> Zero friction. Dark theme inspired by Mistral AI's design language.

---

## 1. What This Is

A single-page React app (TypeScript + Supabase) with two views that share the same data:

1. **List View** - a clean task list grouped by category, filterable and sortable
2. **Canvas View** - an infinite pannable/zoomable canvas where tasks appear as cards and users can also place sticky notes, freeform text, and group things spatially

Tasks are the atomic unit. Tasks support one level of subtasks (simple checkboxes). Everything else - canvas position, sticky notes, report generation - wraps around them.

The team starts at 3 people (Andy, Sanobar, Anna) and will double within a month. Architecture decisions should assume 10-15 concurrent users comfortably.

---

## 2. Design Language

Pull from Mistral AI's public design system (French-engineered minimalism, purple-toned dark theme). Dark only - no light mode.

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0F0F0F` | App background |
| `--bg-surface` | `#1A1A1A` | Cards, panels, modals |
| `--bg-surface-hover` | `#242424` | Hover states |
| `--bg-surface-active` | `#2E2E2E` | Selected/active states |
| `--border-default` | `#2A2A2A` | Subtle borders |
| `--border-focus` | `#7C3AED` | Focus rings, active elements |
| `--text-primary` | `#F5F5F5` | Headings, primary content |
| `--text-secondary` | `#A0A0A0` | Descriptions, metadata |
| `--text-muted` | `#666666` | Timestamps, hints |
| `--accent-purple` | `#7C3AED` | Primary actions, links |
| `--accent-purple-hover` | `#6D28D9` | Hover on primary actions |
| `--status-wip` | `#F59E0B` | WIP / half-circle status |
| `--status-done` | `#10B981` | Complete |
| `--status-todo` | `#6B7280` | Not started |
| `--cat-education` | `#818CF8` | Education category |
| `--cat-resources` | `#34D399` | Resources category |
| `--cat-support` | `#F472B6` | Support category |
| `--cat-admin` | `#FB923C` | Admin category |

### Typography

- Font: `Inter` (load via Google Fonts) with `system-ui` fallback
- Scale: 13px body, 11px metadata, 16px section headers, 20px page title
- Weight: 400 normal, 500 medium for labels, 600 semibold for headings
- Letter spacing: -0.01em on headings, normal on body

### Visual Rules

- Border radius: 8px cards, 6px buttons, 4px inputs, 12px modals
- Shadows: none on cards (rely on border contrast against bg), subtle `0 8px 32px rgba(0,0,0,0.4)` on modals/dropdowns
- Transitions: 150ms ease-out on all interactive elements
- No gradients. No glows. Clean flat surfaces only.
- Status indicator: a small circle icon (empty = todo, half-filled = wip, full = done) - matches the Signals app convention

---

## 3. Data Model (Supabase / Postgres)

### `teams`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        text NOT NULL
created_at  timestamptz DEFAULT now()
```

### `profiles`
```sql
id          uuid PRIMARY KEY REFERENCES auth.users(id)
team_id     uuid REFERENCES teams(id)
display_name text NOT NULL
avatar_url  text
role        text DEFAULT 'member' CHECK (role IN ('admin', 'member'))
```

### `tasks`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
team_id     uuid REFERENCES teams(id) NOT NULL
title       text NOT NULL
notes       text          -- markdown supported
status      text DEFAULT 'todo' CHECK (status IN ('todo', 'wip', 'done'))
category    text DEFAULT 'admin' CHECK (category IN ('education', 'resources', 'support', 'admin'))
assigned_to uuid REFERENCES profiles(id)
created_by  uuid REFERENCES profiles(id) NOT NULL
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
completed_at timestamptz  -- set when status changes to 'done'
due_date    date
sort_order  integer DEFAULT 0
```

### `subtasks`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
task_id     uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL
title       text NOT NULL
is_done     boolean DEFAULT false
sort_order  integer DEFAULT 0
created_at  timestamptz DEFAULT now()
```

One level only. No nesting. Subtasks are simple checkboxes - no status cycle, no assignment, no category.

### `task_images`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
task_id     uuid REFERENCES tasks(id) ON DELETE CASCADE
storage_path text NOT NULL  -- Supabase storage path
caption     text
created_at  timestamptz DEFAULT now()
```

### `canvas_positions`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
team_id     uuid REFERENCES teams(id) NOT NULL
item_type   text NOT NULL CHECK (item_type IN ('task', 'sticky'))
item_id     uuid          -- references tasks(id) if item_type = 'task', null for stickies
x           float NOT NULL DEFAULT 0
y           float NOT NULL DEFAULT 0
width       float DEFAULT 280
height      float         -- null = auto-size
z_index     integer DEFAULT 0
```

### `sticky_notes`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
canvas_position_id uuid REFERENCES canvas_positions(id) ON DELETE CASCADE
team_id     uuid REFERENCES teams(id) NOT NULL
content     text DEFAULT ''
color       text DEFAULT '#7C3AED'  -- accent purple default
created_by  uuid REFERENCES profiles(id) NOT NULL
created_at  timestamptz DEFAULT now()
```

### Row Level Security

- All tables: users can only read/write rows where `team_id` matches their `profiles.team_id`
- `tasks`: any team member can create, only creator or admin can delete
- `subtasks`: anyone on the team can check/uncheck or add subtasks
- `canvas_positions`: any team member can move any item (collaborative)

---

## 4. Views & Interactions

### 4a. List View (Default)

Layout: single column, full width, with a sticky top bar.

**Top Bar**
- App title: "Pulse" (left)
- View toggle: List | Canvas (pill toggle, center)
- "Generate Report" button (ghost style, left of user avatar)
- User avatar + name (right)
- "+ New Task" button (accent purple, right side of top bar)

**Filter Bar** (below top bar, inline)
- Category filter: chips for Education / Resources / Support / Admin (multi-select, colored dot prefix)
- Status filter: Todo / WIP / Done chips
- Assigned filter: avatar bubbles for each team member (includes "Unassigned" option)
- All filters default to "all" - tapping toggles them on/off

**Task List**
- Grouped by category (collapsible sections)
- Each task row:
  - Status circle (clickable - cycles todo > wip > done on single click)
  - Title (editable inline on click)
  - Subtask count indicator (e.g. "2/4" if 2 of 4 subtasks done, only shows if subtasks exist)
  - Category pill (small, colored)
  - Assigned avatar (small circle, or empty dashed circle if unassigned - clicking opens quick-assign dropdown)
  - Due date (text, muted, or "No date")
  - Image indicator icon (if task has images)
  - Notes indicator icon (if task has notes)
- Click anywhere on a task row (except status circle and assign avatar) opens the **Task Detail Panel**
- Drag to reorder within a category

**Task Detail Panel** (slide-in from right, 400px wide)
- Title (large, editable)
- Status selector (three circles: todo/wip/done)
- Category selector (four buttons with color coding)
- Assigned to (dropdown of team members, includes "Unassigned")
- Due date (date picker)
- **Subtasks section:**
  - List of checkbox items
  - Each subtask: checkbox + editable title + delete (X) on hover
  - "+ Add subtask" input at bottom (hit Enter to add, auto-focus for rapid entry)
  - Drag to reorder
  - Progress bar showing completion (thin, accent colored)
- Notes (markdown editor, simple - just bold/italic/lists, no WYSIWYG bloat)
- Images section:
  - Grid of thumbnails
  - Click to expand
  - Drag-and-drop or click to upload (Supabase Storage)
  - Max 10 images per task
- Created by / created at (footer, muted text)
- Delete button (bottom, red text, confirms)

### 4b. Canvas View

An infinite canvas (think Miro/FigJam but stripped way down).

**Canvas Inbox Zone**
- Fixed zone on the left edge of the canvas (visually distinct - slightly lighter bg, dashed border, labeled "Inbox")
- New tasks auto-appear here as cards when created from either view
- Users drag cards out of the inbox to place them on the canvas
- Once a card is dragged out of the inbox, it stays where it's placed
- Inbox is scrollable if many unplaced tasks accumulate

**Canvas Controls**
- Same top bar as List View
- Zoom: scroll wheel or pinch. Display zoom % in bottom-right corner. Range 25%-400%.
- Pan: click+drag on empty space, or middle mouse
- Minimap: small rectangle in bottom-right showing viewport position (toggle-able)

**Task Cards on Canvas**
- Same data as list view, rendered as cards (280px wide default)
- Show: status circle, title, category pill, assigned avatar, subtask progress (e.g. "2/4")
- Single click: select (shows resize handles + purple border)
- Double click: opens Task Detail Panel (same as list view)
- Drag to move
- Status circle on canvas cards is clickable (cycles status same as list view)
- Cards snap to a subtle 20px grid (hold Shift to disable snap)

**Sticky Notes**
- Created via right-click context menu > "Add Sticky Note" or a floating "+" button
- Simple text area, no markdown
- Color picker (preset: purple, amber, emerald, pink, slate)
- Resizable
- Can be deleted via right-click > Delete or backspace when selected

**Canvas Toolbar** (floating, bottom center)
- Select tool (default)
- Sticky note tool (click to place)
- Zoom to fit (frames all items)
- Reset view (0,0 at 100%)

**Real-Time Sync**
- Supabase Realtime subscriptions on `tasks`, `subtasks`, `canvas_positions`, `sticky_notes`
- Other users' cursors shown as small labeled dots (optional, low priority - nice for when team doubles)
- Debounce position updates at 100ms during drag, final position on drag end
- Optimistic UI: update local state immediately, reconcile with server response

---

## 5. Assignment Flow

Mixed model - both top-down assignment and self-assignment:

- Tasks can be created unassigned (default)
- Anyone can assign a task to anyone (including themselves)
- Quick-assign: click the avatar circle on a task row to get a dropdown of team members
- Filter by "Assigned to me" for personal focus view
- Filter by "Unassigned" to see what needs to be picked up

---

## 6. Report Generation

**"Generate Report" button** in the top bar (both views). Any team member can generate.

**Report Modal**
- Date range picker (default: last 7 days, Mon-Sun)
- Preview of completed tasks in that range, grouped by category
- Subtasks included under their parent task (indented, with checkmark)
- "Copy to Clipboard" button (copies formatted markdown)
- "Export PDF" button

**Report Format (Markdown)**

```
# Pulse - Weekly Report
## Applied Technology
## [Start Date] - [End Date]

### Education (X completed)
- [Task title] - [Assigned to] - Completed [date]
  - [x] Subtask 1
  - [x] Subtask 2
- ...

### Resources (X completed)
- ...

### Support (X completed)
- ...

### Admin (X completed)
- ...

---

### Summary
- Total completed: X tasks
- By team member:
  - Andy: X tasks
  - Sanobar: X tasks
  - Anna: X tasks
- Still in progress: X tasks (X subtasks remaining)
```

Query: `SELECT t.*, array_agg(s.*) as subtasks FROM tasks t LEFT JOIN subtasks s ON s.task_id = t.id WHERE t.status = 'done' AND t.completed_at BETWEEN [start] AND [end] AND t.team_id = [team_id] GROUP BY t.id ORDER BY t.category, t.completed_at`

---

## 7. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React 18 + TypeScript | Matches existing KPF tooling (Signals v1) |
| Build | Vite | Fast, simple |
| Styling | Tailwind CSS + CSS custom properties | Utility-first, design tokens via CSS vars |
| Canvas | tldraw (recommended) or React Flow | tldraw handles freeform canvas + mixed content natively; evaluate in Phase 3 spike |
| State | Zustand | Lightweight, no boilerplate |
| Backend | Supabase (Auth, DB, Storage, Realtime) | Already in use for Signals v1 |
| Rich Text | tiptap (minimal config) | Notes field only, keep it light |
| PDF Export | @react-pdf/renderer or html2pdf | For weekly reports |
| Hosting | Vercel | Simple deploys, preview URLs per PR |

### Future Integration: Microsoft Teams Notifications
- Not in v1, but architected for it
- Approach: Supabase Edge Function triggered by DB webhook on task insert/update
- Posts to Teams channel via incoming webhook connector
- Notification events to support later: task assigned to you, task completed, weekly report auto-generated
- Keep a `notification_preferences` table stub in the schema now so we don't need a migration later

---

## 8. Auth & Onboarding

- Supabase Auth with magic link (email-based, no passwords)
- First user creates a team, gets a shareable invite link
- Invite link auto-adds new users to the team
- No public registration - invite only
- Roles: admin (can delete any task, manage team) and member (can create/edit tasks)

---

## 9. Implementation Phases

### Phase 1 - Foundation
- [ ] Supabase project setup (schema including subtasks table, RLS, storage bucket)
- [ ] Auth flow (magic link, invite link)
- [ ] Basic layout shell (top bar, view toggle, empty states)
- [ ] Stub `notification_preferences` table for future Teams integration

### Phase 2 - List View
- [ ] Task CRUD (create, edit inline, delete)
- [ ] Status cycling (click circle to advance)
- [ ] Category grouping and filtering
- [ ] Assignment flow (quick-assign dropdown, filter by assignee)
- [ ] Task Detail Panel (slide-in)
- [ ] Subtasks (add, check/uncheck, reorder, delete, progress indicator)
- [ ] Notes field with tiptap
- [ ] Image upload and display

### Phase 3 - Canvas View
- [ ] Canvas library spike: tldraw vs React Flow (1-2 day evaluation)
- [ ] Infinite canvas with pan/zoom
- [ ] Canvas Inbox zone (left edge, new tasks auto-appear here)
- [ ] Render tasks as draggable cards
- [ ] Drag from inbox to place on canvas
- [ ] Canvas position persistence (save x/y to DB)
- [ ] Sticky notes (create, edit, color, delete)
- [ ] Grid snapping
- [ ] Zoom controls + minimap

### Phase 4 - Real-Time & Polish
- [ ] Supabase Realtime subscriptions (tasks, subtasks, canvas_positions, sticky_notes)
- [ ] Optimistic UI updates
- [ ] Keyboard shortcuts (N = new task, 1/2/3 = status, Esc = close panel, Tab = add subtask)
- [ ] Empty states and loading skeletons
- [ ] Mobile responsive (list view only on mobile, canvas is desktop)
- [ ] Cursor presence (show other users' cursors on canvas - nice-to-have)

### Phase 5 - Reports
- [ ] Report generation modal
- [ ] Date range picker
- [ ] Markdown preview with subtask rollup
- [ ] Clipboard copy
- [ ] PDF export

### Phase 6 - Teams Notifications (Future)
- [ ] Supabase Edge Function for webhook dispatch
- [ ] Microsoft Teams incoming webhook integration
- [ ] Notification preferences UI
- [ ] Events: task assigned, task completed, weekly report auto-send
- [ ] Optional: auto-generate report every Monday 8am via Supabase cron

---

## 10. File Structure

```
pulse/
  src/
    components/
      ui/                # Shared primitives (Button, Input, Modal, Chip, Avatar)
      task/
        TaskRow.tsx
        TaskDetailPanel.tsx
        TaskCard.tsx      # Canvas card variant
        StatusCircle.tsx
        CategoryPill.tsx
        SubtaskList.tsx
        SubtaskItem.tsx
        QuickAssign.tsx
      canvas/
        InfiniteCanvas.tsx
        CanvasInbox.tsx
        StickyNote.tsx
        CanvasToolbar.tsx
        Minimap.tsx
      report/
        ReportModal.tsx
        ReportPreview.tsx
      layout/
        TopBar.tsx
        FilterBar.tsx
        ViewToggle.tsx
    hooks/
      useTasks.ts
      useSubtasks.ts
      useCanvasPositions.ts
      useStickyNotes.ts
      useRealtimeSync.ts
      useAuth.ts
      useTeam.ts
    stores/
      taskStore.ts        # Zustand
      canvasStore.ts
      uiStore.ts
    lib/
      supabase.ts         # Client init
      types.ts            # Shared TypeScript types matching DB schema
      constants.ts        # Design tokens, category config, status config
      reportGenerator.ts  # Markdown + PDF generation
    styles/
      globals.css         # CSS custom properties (design tokens), Tailwind base
  supabase/
    migrations/
      001_initial_schema.sql
      002_notification_preferences_stub.sql
    seed.sql              # Demo data for development
  DESIGN.md               # Mistral-inspired design tokens for agent reference
  .env.local              # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

---

## 11. Non-Goals (v1)

- No comments/threads on tasks (just notes)
- No nested subtasks (one level only)
- No time tracking
- No gantt chart
- No custom fields
- No recurring tasks
- No notifications in v1 (Teams integration is Phase 6)
- No dark/light toggle (dark only)
- No mobile canvas (list view only on small screens)

---

## 12. Open Questions

1. **Canvas library**: Run a 1-2 day spike comparing tldraw vs React Flow. tldraw is purpose-built for infinite canvas with mixed content (closer to what we need). React Flow is more mature for node-graph layouts but may fight us on freeform stickies.
2. **Offline support**: Not in v1, but Supabase local-first tooling is maturing. Flag for later.
3. **Image storage limits**: Set a per-team Supabase Storage quota? 1GB should be plenty for v1.
4. **Report scheduling**: Auto-generate and post to Teams every Monday morning via Supabase Edge Function + cron. Save for Phase 6.
5. **Canvas done state**: When a task is marked done, its canvas card dims to 60% opacity. When a task is deleted, its canvas position is cascade-deleted. (Resolved)
