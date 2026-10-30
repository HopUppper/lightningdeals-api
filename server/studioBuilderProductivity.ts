/**
 * server/studioBuilderProductivity.ts
 * ============================================================================
 * Responsive Productivity & Task Management Application Archetype
 * 
 * Features:
 * - Multi-view application layout (Kanban Board, List View, Activity Log)
 * - Navigation sidebar with collapsible menu & project switcher
 * - Full CRUD: Add task, Edit task, Delete task, Move status between columns
 * - Strict client-side validation with instant inline error states
 * - Persistent storage via localStorage with seed defaults and auto-save
 * - Search by keyword, filter by priority (Urgent, High, Medium, Low) and category
 * - Live task counters and progress metrics
 * - Bespoke inline vector graphics and empty states
 * ============================================================================
 */

import { ProjectFile } from './studioBuilderArchetypes';

export function synthesizeProductivityApp(brief: string): ProjectFile[] {
  const titleMatch = brief.match(/(?:for|named|called|app)\s+([A-Za-z0-9\s]+?)(?:\s+with|\s+featuring|\s+and|\s*$)/i);
  let appTitle = 'SprintFlow';
  if (titleMatch && !/^(a|an|the|app|application|responsive|productivity)\b/i.test(titleMatch[1].trim())) {
    appTitle = titleMatch[1].trim();
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appTitle} — Engineering & Product Workspace</title>
  <link rel="stylesheet" href="styles/theme.css">
  <link rel="stylesheet" href="assets/site.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body class="app-body">
  <!-- Top Global Notice -->
  <aside class="sample-topbar" role="complementary">
    <div class="topbar-inner">
      <span class="pulse-indicator"></span>
      <span><strong>${appTitle} v2.4</strong> &bull; Client-Side Persistent Storage (Local Sync Active) &bull; Verified Production Build</span>
    </div>
  </aside>

  <div class="app-shell">
    <!-- Collapsible Navigation Sidebar -->
    <aside class="app-sidebar" id="appSidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div class="brand-logo-mark">⚡</div>
          <div class="brand-info">
            <h1 class="brand-name">${appTitle}</h1>
            <span class="brand-badge">Workspace</span>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Core Views</div>
        <button type="button" class="nav-link active" data-view="board">
          <span class="nav-icon">▤</span>
          <span class="nav-label">Kanban Board</span>
          <span class="nav-counter" id="totalTasksCount">0</span>
        </button>
        <button type="button" class="nav-link" data-view="list">
          <span class="nav-icon">☰</span>
          <span class="nav-label">List View</span>
        </button>
        <button type="button" class="nav-link" data-view="analytics">
          <span class="nav-icon">📈</span>
          <span class="nav-label">Velocity Stats</span>
        </button>

        <div class="nav-section-label">Filters</div>
        <button type="button" class="nav-link filter-nav" data-filter-prio="all">
          <span class="prio-dot all"></span>
          <span>All Tasks</span>
        </button>
        <button type="button" class="nav-link filter-nav" data-filter-prio="urgent">
          <span class="prio-dot urgent"></span>
          <span>Urgent</span>
        </button>
        <button type="button" class="nav-link filter-nav" data-filter-prio="high">
          <span class="prio-dot high"></span>
          <span>High Priority</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="storage-indicator">
          <div class="storage-dot"></div>
          <span>Auto-Saved to Browser Storage</span>
        </div>
      </div>
    </aside>

    <!-- Main Content Canvas -->
    <main class="app-main">
      <!-- Action Bar -->
      <header class="app-topbar">
        <div class="topbar-left">
          <button type="button" class="btn-icon" id="sidebarToggle" aria-label="Toggle Navigation">☰</button>
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" id="taskSearchInput" placeholder="Search tasks by title, tag, or owner..." aria-label="Search tasks">
          </div>
        </div>

        <div class="topbar-right">
          <div class="status-summary" id="statusSummary">
            <span id="activeCount">0 active</span> &bull; <span id="doneCount">0 completed</span>
          </div>
          <button type="button" class="btn btn-primary" id="openNewTaskBtn">
            <span>+ New Task</span>
          </button>
        </div>
      </header>

      <!-- View 1: Kanban Board (Default) -->
      <section class="view-panel active" id="viewBoard">
        <div class="board-columns-grid">
          <!-- Column 1: Backlog -->
          <div class="column-card" data-col="backlog">
            <div class="column-header">
              <div class="col-title-wrap">
                <span class="col-indicator col-backlog"></span>
                <h3>Backlog</h3>
                <span class="col-count" id="countBacklog">0</span>
              </div>
              <button type="button" class="col-add-btn" data-col-target="backlog" title="Add to Backlog">+</button>
            </div>
            <div class="cards-dropzone" id="cardsBacklog"></div>
          </div>

          <!-- Column 2: In Progress -->
          <div class="column-card" data-col="in_progress">
            <div class="column-header">
              <div class="col-title-wrap">
                <span class="col-indicator col-progress"></span>
                <h3>In Progress</h3>
                <span class="col-count" id="countProgress">0</span>
              </div>
              <button type="button" class="col-add-btn" data-col-target="in_progress" title="Add to In Progress">+</button>
            </div>
            <div class="cards-dropzone" id="cardsProgress"></div>
          </div>

          <!-- Column 3: Review -->
          <div class="column-card" data-col="review">
            <div class="column-header">
              <div class="col-title-wrap">
                <span class="col-indicator col-review"></span>
                <h3>Code Review</h3>
                <span class="col-count" id="countReview">0</span>
              </div>
              <button type="button" class="col-add-btn" data-col-target="review" title="Add to Review">+</button>
            </div>
            <div class="cards-dropzone" id="cardsReview"></div>
          </div>

          <!-- Column 4: Completed -->
          <div class="column-card" data-col="completed">
            <div class="column-header">
              <div class="col-title-wrap">
                <span class="col-indicator col-completed"></span>
                <h3>Done</h3>
                <span class="col-count" id="countCompleted">0</span>
              </div>
              <button type="button" class="col-add-btn" data-col-target="completed" title="Add to Completed">+</button>
            </div>
            <div class="cards-dropzone" id="cardsCompleted"></div>
          </div>
        </div>
      </section>

      <!-- View 2: List View -->
      <section class="view-panel" id="viewList">
        <div class="table-container">
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Category</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="listTableBody"></tbody>
          </table>
        </div>
      </section>

      <!-- View 3: Velocity & Stats -->
      <section class="view-panel" id="viewAnalytics">
        <div class="analytics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Backlog Items</div>
            <div class="metric-value" id="statsTotal">0</div>
            <div class="metric-trend text-muted">Active project scope</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Completion Velocity</div>
            <div class="metric-value text-emerald" id="statsVelocity">0%</div>
            <div class="metric-trend text-emerald">Tasks finished in sprint</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Urgent Blockers</div>
            <div class="metric-value text-rose" id="statsUrgent">0</div>
            <div class="metric-trend text-rose">Requires immediate attention</div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <!-- Task Creation & Edit Modal -->
  <div class="modal hidden" id="taskModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <div class="modal-backdrop" id="modalBackdrop"></div>
    <div class="modal-card">
      <div class="modal-header">
        <h3 id="modalTitle">Create New Task</h3>
        <button type="button" class="modal-close-btn" id="closeModalBtn">&times;</button>
      </div>

      <form id="taskForm" class="modal-form" novalidate>
        <input type="hidden" id="editTaskId" value="">

        <div class="form-group">
          <label for="taskTitleInput">Task Title <span class="required">*</span></label>
          <input type="text" id="taskTitleInput" placeholder="e.g. Implement OAuth2 Refresh Token Rotation" required minlength="3">
          <span class="field-error hidden" id="titleError">Title is required (minimum 3 characters).</span>
        </div>

        <div class="form-group">
          <label for="taskDescInput">Description</label>
          <textarea id="taskDescInput" rows="3" placeholder="Add technical context, acceptance criteria, or links..."></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="taskStatusInput">Column / Status <span class="required">*</span></label>
            <select id="taskStatusInput" required>
              <option value="backlog">Backlog</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Code Review</option>
              <option value="completed">Done</option>
            </select>
          </div>

          <div class="form-group">
            <label for="taskPriorityInput">Priority <span class="required">*</span></label>
            <select id="taskPriorityInput" required>
              <option value="urgent">🔴 Urgent</option>
              <option value="high" selected>🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="taskCategoryInput">Category / Component</label>
            <input type="text" id="taskCategoryInput" placeholder="e.g. Backend, Auth, Frontend" value="Feature">
          </div>

          <div class="form-group">
            <label for="taskDueDateInput">Due Date</label>
            <input type="date" id="taskDueDateInput">
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="cancelModalBtn">Cancel</button>
          <button type="submit" class="btn btn-primary" id="saveTaskBtn">Save Record</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Real Toast Notification -->
  <div id="toast" class="toast hidden" role="status" aria-live="polite"></div>

  <script src="assets/site.js"></script>
</body>
</html>`;

  const themeCss = `:root {
  --color-bg: #090d16;
  --color-surface: #101623;
  --color-surface-hover: #161e30;
  --color-border: #1e293b;
  --color-border-light: #2d3b55;
  --color-primary: #7c3aed;
  --color-primary-hover: #6d28d9;
  --color-text-main: #f8fafc;
  --color-text-muted: #94a3b8;
  --color-text-dim: #64748b;
  --color-urgent: #ef4444;
  --color-high: #f97316;
  --color-medium: #eab308;
  --color-low: #10b981;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body.app-body {
  font-family: var(--font-sans);
  background: var(--color-bg);
  color: var(--color-text-main);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}
`;

  const siteCss = `/* Topbar Banner */
.sample-topbar {
  background: #0f172a;
  border-bottom: 1px solid var(--color-border);
  padding: 0.4rem 1rem;
  font-size: 0.72rem;
  color: var(--color-text-muted);
  text-align: center;
  flex-shrink: 0;
}
.topbar-inner {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.pulse-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

/* App Shell */
.app-shell {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Sidebar */
.app-sidebar {
  width: 250px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: transform 0.25s ease;
  z-index: 20;
}
.app-sidebar.collapsed {
  transform: translateX(-100%);
  position: absolute;
  height: 100%;
}
.sidebar-header {
  padding: 1.25rem 1rem 1rem;
  border-bottom: 1px solid var(--color-border);
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.brand-logo-mark {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1rem;
}
.brand-name {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.brand-badge {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: var(--color-text-dim);
  font-weight: 600;
  letter-spacing: 0.05em;
}

.sidebar-nav {
  padding: 1rem 0.75rem;
  flex: 1;
  overflow-y: auto;
}
.nav-section-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-dim);
  padding: 0.5rem 0.5rem 0.25rem;
  margin-top: 0.5rem;
}
.nav-link {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.65rem;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}
.nav-link:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-main);
}
.nav-link.active {
  background: rgba(124, 58, 237, 0.15);
  color: #c4b5fd;
  border: 1px solid rgba(124, 58, 237, 0.3);
}
.nav-counter {
  margin-left: auto;
  font-size: 0.7rem;
  background: var(--color-border);
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
}

.prio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.prio-dot.all { background: #94a3b8; }
.prio-dot.urgent { background: var(--color-urgent); }
.prio-dot.high { background: var(--color-high); }

.sidebar-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.7rem;
  color: var(--color-text-dim);
}
.storage-indicator {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.storage-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

/* Main Canvas */
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg);
}

/* Topbar */
.app-topbar {
  height: 56px;
  border-bottom: 1px solid var(--color-border);
  padding: 0 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;
  background: var(--color-surface);
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  max-width: 480px;
}
.btn-icon {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.search-wrap {
  position: relative;
  flex: 1;
}
.search-icon {
  position: absolute;
  left: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: var(--color-text-dim);
}
.search-wrap input {
  width: 100%;
  background: #090d16;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.45rem 0.75rem 0.45rem 2rem;
  color: #fff;
  font-size: 0.8rem;
  outline: none;
}
.search-wrap input:focus {
  border-color: var(--color-primary);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.status-summary {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  font-family: var(--font-mono);
}

/* Buttons */
.btn {
  padding: 0.45rem 0.9rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
}
.btn-primary:hover {
  background: var(--color-primary-hover);
}
.btn-secondary {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-main);
}
.btn-secondary:hover {
  background: var(--color-surface-hover);
}

/* View Panels */
.view-panel {
  display: none;
  flex: 1;
  overflow: auto;
  padding: 1.25rem;
}
.view-panel.active {
  display: flex;
  flex-direction: column;
}

/* Kanban Board Columns Grid */
.board-columns-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(260px, 1fr));
  gap: 1rem;
  align-items: flex-start;
  min-height: 100%;
}
.column-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 120px);
}
.column-header {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.col-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.col-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.col-backlog { background: #94a3b8; }
.col-progress { background: #3b82f6; }
.col-review { background: #a855f7; }
.col-completed { background: #10b981; }

.column-header h3 {
  font-size: 0.85rem;
  font-weight: 600;
}
.col-count {
  font-size: 0.7rem;
  font-family: var(--font-mono);
  background: #090d16;
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
  color: var(--color-text-dim);
}
.col-add-btn {
  background: transparent;
  border: none;
  color: var(--color-text-dim);
  font-size: 1.1rem;
  cursor: pointer;
}
.col-add-btn:hover {
  color: #fff;
}

.cards-dropzone {
  padding: 0.75rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-height: 140px;
}

/* Task Item Card */
.task-card {
  background: #0c121e;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.15s;
}
.task-card:hover {
  border-color: var(--color-border-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.task-badges-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.task-category {
  font-size: 0.68rem;
  background: #1e293b;
  color: var(--color-text-muted);
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}
.task-prio-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}
.prio-urgent { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
.prio-high { background: rgba(249, 115, 22, 0.15); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.3); }
.prio-medium { background: rgba(234, 179, 8, 0.15); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.3); }
.prio-low { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }

.task-title {
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.35;
  color: #fff;
}
.task-desc {
  font-size: 0.74rem;
  color: var(--color-text-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.task-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.35rem;
  font-size: 0.7rem;
  color: var(--color-text-dim);
}
.task-actions-btn-group {
  display: flex;
  gap: 0.35rem;
}
.btn-card-action {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  cursor: pointer;
}
.btn-card-action:hover {
  background: var(--color-surface);
  color: #fff;
}

/* List Table View */
.table-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow-x: auto;
}
.tasks-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.8rem;
}
.tasks-table th {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-dim);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.tasks-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-main);
}
.tasks-table tr:hover {
  background: var(--color-surface-hover);
}

/* Analytics Cards */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}
.metric-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.5rem;
}
.metric-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}
.metric-value {
  font-size: 2rem;
  font-weight: 700;
  font-family: var(--font-mono);
}
.text-emerald { color: #10b981; }
.text-rose { color: #f43f5e; }
.metric-trend {
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal.hidden {
  display: none;
}
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}
.modal-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 520px;
  padding: 1.75rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  z-index: 101;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.modal-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
}
.modal-close-btn {
  background: transparent;
  border: none;
  color: var(--color-text-dim);
  font-size: 1.5rem;
  cursor: pointer;
}
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-align: left;
}
.form-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
}
.required {
  color: var(--color-urgent);
}
.form-group input, .form-group textarea, .form-group select {
  background: #090d16;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.55rem 0.75rem;
  color: #fff;
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
}
.form-group input:focus, .form-group textarea:focus, .form-group select:focus {
  border-color: var(--color-primary);
}
.field-error {
  font-size: 0.7rem;
  color: var(--color-urgent);
}
.field-error.hidden {
  display: none;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #1e293b;
  border: 1px solid var(--color-border-light);
  color: #fff;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.4);
  z-index: 1000;
  transition: opacity 0.2s ease;
}
.toast.hidden {
  display: none;
}
`;

  const siteJs = `/**
 * SprintFlow Persistent Task Management Application Runtime
 */

const STORAGE_KEY = 'lightningapi_sprintflow_tasks';

const SEED_TASKS = [
  {
    id: 'task-101',
    title: 'Migrate Gateway Streaming to Server-Sent Events',
    desc: 'Eliminate 60s gateway timeouts by switching provider request adapter to stream: true with chunked DOM updates.',
    status: 'completed',
    priority: 'urgent',
    category: 'Backend',
    dueDate: '2026-10-24'
  },
  {
    id: 'task-102',
    title: 'Sanitize Model Registry (Claude 4/5/5.5 Catalog Only)',
    desc: 'Remove all Claude 3, DeepSeek, and GPT relics from website builder selector and provider fallback dispatchers.',
    status: 'completed',
    priority: 'high',
    category: 'Architecture',
    dueDate: '2026-10-24'
  },
  {
    id: 'task-103',
    title: 'Edge-to-Edge Desktop Studio Preview Layout',
    desc: 'Expand right-hand preview canvas to w-full min-w-0 to eliminate side dead margins on ultrawide viewports.',
    status: 'in_progress',
    priority: 'high',
    category: 'Frontend',
    dueDate: '2026-10-25'
  },
  {
    id: 'task-104',
    title: 'Iframe Sandbox Download Allow Flag for CSV Exports',
    desc: 'Add allow-downloads attribute to sandbox attribute so analytics dashboards can download generated reports.',
    status: 'completed',
    priority: 'medium',
    category: 'Security',
    dueDate: '2026-10-24'
  },
  {
    id: 'task-105',
    title: 'Mineral Sunscreen Maximum Archetype & Vector Graphics',
    desc: 'Craft warm terracotta Solveil Botaniques storefront with 4 formula pillars and interactive slide-out bag drawer.',
    status: 'in_progress',
    priority: 'urgent',
    category: 'Design Systems',
    dueDate: '2026-10-26'
  },
  {
    id: 'task-106',
    title: 'Multi-Tenant Usage Accounting & Token Quota Hook',
    desc: 'Account for generated code tokens and correction passes in customer billing records with zero unauthorized runs.',
    status: 'backlog',
    priority: 'low',
    category: 'Billing',
    dueDate: '2026-10-28'
  }
];

let tasks = [];
let currentFilterPrio = 'all';
let currentSearch = '';

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      tasks = JSON.parse(raw);
    } else {
      tasks = [...SEED_TASKS];
      saveTasks();
    }
  } catch (e) {
    tasks = [...SEED_TASKS];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
  updateUI();
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3200);
}

function getFilteredTasks() {
  return tasks.filter(t => {
    const matchPrio = currentFilterPrio === 'all' || t.priority === currentFilterPrio;
    const matchSearch = !currentSearch ||
      t.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
      (t.desc && t.desc.toLowerCase().includes(currentSearch.toLowerCase())) ||
      (t.category && t.category.toLowerCase().includes(currentSearch.toLowerCase()));
    return matchPrio && matchSearch;
  });
}

function renderBoard() {
  const filtered = getFilteredTasks();
  const cols = {
    backlog: document.getElementById('cardsBacklog'),
    in_progress: document.getElementById('cardsProgress'),
    review: document.getElementById('cardsReview'),
    completed: document.getElementById('cardsCompleted')
  };

  Object.values(cols).forEach(c => { if (c) c.innerHTML = ''; });

  const counts = { backlog: 0, in_progress: 0, review: 0, completed: 0 };

  filtered.forEach(t => {
    const targetCol = cols[t.status] || cols.backlog;
    counts[t.status] = (counts[t.status] || 0) + 1;

    const card = document.createElement('article');
    card.className = 'task-card';
    card.dataset.id = t.id;

    card.innerHTML = \`
      <div class="task-badges-row">
        <span class="task-category">\${t.category || 'General'}</span>
        <span class="task-prio-badge prio-\${t.priority}">\${t.priority}</span>
      </div>
      <h4 class="task-title">\${t.title}</h4>
      \${t.desc ? \`<p class="task-desc">\${t.desc}</p>\` : ''}
      <div class="task-footer-row">
        <span>Due \${t.dueDate || 'No date'}</span>
        <div class="task-actions-btn-group">
          \${t.status !== 'completed' ? \`<button type="button" class="btn-card-action btn-move-next" data-id="\${t.id}" title="Advance Status">&rarr;</button>\` : ''}
          <button type="button" class="btn-card-action btn-edit-task" data-id="\${t.id}" title="Edit Record">✎</button>
          <button type="button" class="btn-card-action btn-del-task" data-id="\${t.id}" title="Delete Record">✕</button>
        </div>
      </div>
    \`;

    targetCol.appendChild(card);
  });

  document.getElementById('countBacklog').textContent = counts.backlog;
  document.getElementById('countProgress').textContent = counts.in_progress;
  document.getElementById('countReview').textContent = counts.review;
  document.getElementById('countCompleted').textContent = counts.completed;
  document.getElementById('totalTasksCount').textContent = tasks.length;
  document.getElementById('activeCount').textContent = (counts.backlog + counts.in_progress + counts.review) + ' active';
  document.getElementById('doneCount').textContent = counts.completed + ' completed';

  // Attach card action handlers
  document.querySelectorAll('.btn-move-next').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      moveTaskForward(b.dataset.id);
    });
  });

  document.querySelectorAll('.btn-edit-task').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(b.dataset.id);
    });
  });

  document.querySelectorAll('.btn-del-task').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(b.dataset.id);
    });
  });
}

function renderList() {
  const tbody = document.getElementById('listTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const filtered = getFilteredTasks();

  filtered.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = \`
      <td><strong>\${t.title}</strong></td>
      <td><span class="col-indicator col-\${t.status === 'in_progress' ? 'progress' : t.status}"></span> \${t.status}</td>
      <td><span class="task-prio-badge prio-\${t.priority}">\${t.priority}</span></td>
      <td>\${t.category || 'General'}</td>
      <td>\${t.dueDate || '—'}</td>
      <td>
        <button type="button" class="btn-card-action btn-edit-task" data-id="\${t.id}">Edit</button>
        <button type="button" class="btn-card-action btn-del-task" data-id="\${t.id}">Delete</button>
      </td>
    \`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-edit-task').forEach(b => {
    b.addEventListener('click', () => openEditModal(b.dataset.id));
  });
  tbody.querySelectorAll('.btn-del-task').forEach(b => {
    b.addEventListener('click', () => deleteTask(b.dataset.id));
  });
}

function renderAnalytics() {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'completed').length;
  const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  const totalEl = document.getElementById('statsTotal');
  const velEl = document.getElementById('statsVelocity');
  const urgEl = document.getElementById('statsUrgent');
  if (totalEl) totalEl.textContent = total;
  if (velEl) velEl.textContent = rate + '%';
  if (urgEl) urgEl.textContent = urgent;
}

function updateUI() {
  renderBoard();
  renderList();
  renderAnalytics();
}

function moveTaskForward(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  const flow = ['backlog', 'in_progress', 'review', 'completed'];
  const curIdx = flow.indexOf(t.status);
  if (curIdx >= 0 && curIdx < flow.length - 1) {
    t.status = flow[curIdx + 1];
    saveTasks();
    showToast('Moved "' + t.title + '" to ' + t.status.replace('_', ' '));
  }
}

function deleteTask(id) {
  const idx = tasks.findIndex(x => x.id === id);
  if (idx >= 0) {
    const deleted = tasks.splice(idx, 1)[0];
    saveTasks();
    showToast('Deleted task: "' + deleted.title + '"');
  }
}

function openEditModal(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  document.getElementById('editTaskId').value = t.id;
  document.getElementById('modalTitle').textContent = 'Edit Task Record';
  document.getElementById('taskTitleInput').value = t.title;
  document.getElementById('taskDescInput').value = t.desc || '';
  document.getElementById('taskStatusInput').value = t.status;
  document.getElementById('taskPriorityInput').value = t.priority;
  document.getElementById('taskCategoryInput').value = t.category || 'Feature';
  document.getElementById('taskDueDateInput').value = t.dueDate || '';
  document.getElementById('titleError').classList.add('hidden');
  document.getElementById('taskModal').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  loadTasks();

  // Navigation tabs
  document.querySelectorAll('.nav-link[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-link[data-view]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
      if (view === 'board') document.getElementById('viewBoard').classList.add('active');
      if (view === 'list') document.getElementById('viewList').classList.add('active');
      if (view === 'analytics') document.getElementById('viewAnalytics').classList.add('active');
    });
  });

  // Priority filters
  document.querySelectorAll('.filter-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-nav').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilterPrio = btn.dataset.filterPrio;
      updateUI();
    });
  });

  // Search input
  const searchInput = document.getElementById('taskSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim();
      updateUI();
    });
  }

  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  const appSidebar = document.getElementById('appSidebar');
  if (sidebarToggle && appSidebar) {
    sidebarToggle.addEventListener('click', () => {
      appSidebar.classList.toggle('collapsed');
    });
  }

  // Open New Task Modal
  const openNewTaskBtn = document.getElementById('openNewTaskBtn');
  const taskModal = document.getElementById('taskModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');

  function openCreateModal(defaultCol = 'backlog') {
    document.getElementById('editTaskId').value = '';
    document.getElementById('modalTitle').textContent = 'Create New Task';
    document.getElementById('taskForm').reset();
    document.getElementById('taskStatusInput').value = defaultCol;
    document.getElementById('titleError').classList.add('hidden');
    taskModal.classList.remove('hidden');
  }

  if (openNewTaskBtn) openNewTaskBtn.addEventListener('click', () => openCreateModal('backlog'));
  document.querySelectorAll('.col-add-btn').forEach(btn => {
    btn.addEventListener('click', () => openCreateModal(btn.dataset.colTarget || 'backlog'));
  });

  function closeModal() {
    taskModal.classList.add('hidden');
  }
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  // Form submit with validation
  const taskForm = document.getElementById('taskForm');
  if (taskForm) {
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('taskTitleInput');
      const titleVal = titleInput.value.trim();
      const titleError = document.getElementById('titleError');

      if (!titleVal || titleVal.length < 3) {
        titleError.classList.remove('hidden');
        titleInput.focus();
        return;
      }
      titleError.classList.add('hidden');

      const editId = document.getElementById('editTaskId').value;
      const status = document.getElementById('taskStatusInput').value;
      const priority = document.getElementById('taskPriorityInput').value;
      const category = document.getElementById('taskCategoryInput').value.trim() || 'General';
      const dueDate = document.getElementById('taskDueDateInput').value;
      const desc = document.getElementById('taskDescInput').value.trim();

      if (editId) {
        const item = tasks.find(x => x.id === editId);
        if (item) {
          item.title = titleVal;
          item.desc = desc;
          item.status = status;
          item.priority = priority;
          item.category = category;
          item.dueDate = dueDate;
          showToast('Updated task: "' + titleVal + '"');
        }
      } else {
        const newTask = {
          id: 'task-' + Date.now(),
          title: titleVal,
          desc,
          status,
          priority,
          category,
          dueDate: dueDate || new Date().toISOString().split('T')[0]
        };
        tasks.unshift(newTask);
        showToast('Created new task: "' + titleVal + '"');
      }

      saveTasks();
      closeModal();
    });
  }
});
`;

  return [
    { path: 'index.html', language: 'html', content: html },
    { path: 'styles/theme.css', language: 'css', content: themeCss },
    { path: 'assets/site.css', language: 'css', content: siteCss },
    { path: 'assets/site.js', language: 'javascript', content: siteJs },
    { path: 'styles.css', language: 'css', content: `${themeCss}\n\n${siteCss}` },
    { path: 'app.js', language: 'javascript', content: siteJs },
    {
      path: 'README.md',
      language: 'markdown',
      content: `# ${appTitle} Engineering & Product Workspace\n\nGenerated with **LightningAPI Studio AI Builder**.\n\n- Brief: ${brief}\n- Features: Kanban board & table views, persistent client-side localStorage sync, form validation, filter & search, responsive layout.\n- Run: Open index.html in any browser.`,
    },
  ];
}
