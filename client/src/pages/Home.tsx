import { useEffect, useMemo, useState } from "react";
import {
  ArrowUp,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  Flag,
  Inbox,
  ListTodo,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  X,
  Palette,
  Flame,
  Tag,
  CheckSquare,
  User as UserIcon,
} from "lucide-react";

import FocusTimer from "../components/FocusTimer";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import CommandPalette from "../components/CommandPalette";
import TaskDetailModal, { FullTask } from "../components/TaskDetailModal";
import NotificationCenter, { NotificationItem } from "../components/NotificationCenter";
import ProfileSection, { UserProfile, loadUserProfile } from "../components/ProfileSection";
import { soundFx } from "../lib/soundEffects";
import { triggerConfetti } from "../lib/confetti";

type Priority = "high" | "medium" | "low";
type ViewMode = "today" | "active" | "completed" | "focus" | "analytics" | "profile";
type PriorityFilter = "all" | Priority;
type CategoryFilter = "all" | "work" | "personal" | "health" | "creative" | "study";

const STORAGE_KEY = "focuslist-tasks-v2";
const THEME_STORAGE_KEY = "focuslist-theme-v1";
const NOTIF_STORAGE_KEY = "focuslist-notifs-v1";

const starterTasks: FullTask[] = [
  {
    id: "starter-1",
    title: "Design FocusList frontend architecture & visual suite",
    priority: "high",
    category: "work",
    estimatedMinutes: 50,
    dueDate: "2026-09-20",
    notes: "Ensure multi-theme engine, audio feedback, and focus timer operate seamlessly offline.",
    subtasks: [
      { id: "st-1", title: "Setup CSS variable design tokens", completed: true },
      { id: "st-2", title: "Implement Web Audio sound synthesizer", completed: true },
      { id: "st-3", title: "Build Recharts velocity dashboard", completed: false },
    ],
    completed: false,
    createdAt: Date.now() - 1000 * 60 * 42,
  },
  {
    id: "starter-2",
    title: "25-minute Pomodoro deep focus session",
    priority: "high",
    category: "study",
    estimatedMinutes: 25,
    completed: false,
    createdAt: Date.now() - 1000 * 60 * 66,
  },
  {
    id: "starter-3",
    title: "Hydrate & take a 10-minute mindful walk outdoors",
    priority: "medium",
    category: "health",
    estimatedMinutes: 15,
    completed: false,
    createdAt: Date.now() - 1000 * 60 * 90,
  },
  {
    id: "starter-4",
    title: "Review daily priority agenda and email responses",
    priority: "medium",
    category: "personal",
    estimatedMinutes: 25,
    completed: true,
    createdAt: Date.now() - 1000 * 60 * 110,
  },
  {
    id: "starter-5",
    title: "Explore creative dark ambient theme customization",
    priority: "low",
    category: "creative",
    estimatedMinutes: 20,
    completed: true,
    createdAt: Date.now() - 1000 * 60 * 130,
  },
];

const starterNotifications: NotificationItem[] = [
  {
    id: "n-1",
    title: "Welcome to FocusList",
    message: "Your deep work workspace is ready. Try setting a Pomodoro timer or adding subtasks!",
    timestamp: Date.now() - 1000 * 60 * 15,
    read: false,
    type: "info",
  },
  {
    id: "n-2",
    title: "Theme Customization",
    message: "Press ⌘K or click Palette to switch between Zen, Obsidian, Nordic, & Sunset themes.",
    timestamp: Date.now() - 1000 * 60 * 5,
    read: false,
    type: "achievement",
  },
];

const priorityConfig: Record<Priority, { label: string; className: string; dot: string }> = {
  high: { label: "High", className: "priority-high", dot: "bg-[#ee6a5f]" },
  medium: { label: "Medium", className: "priority-medium", dot: "bg-[#e4a348]" },
  low: { label: "Low", className: "priority-low", dot: "bg-[#67a98f]" },
};

const categoryBadgeConfig: Record<string, { label: string; className: string }> = {
  work: { label: "Work 💼", className: "tag-work" },
  personal: { label: "Personal 🏠", className: "tag-personal" },
  health: { label: "Health 🌿", className: "tag-health" },
  creative: { label: "Creative 🎨", className: "tag-creative" },
  study: { label: "Study 📚", className: "tag-study" },
};

function loadTasks(): FullTask[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return starterTasks;
    const parsed = JSON.parse(stored) as FullTask[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : starterTasks;
  } catch {
    return starterTasks;
  }
}

function loadNotifications(): NotificationItem[] {
  try {
    const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (!stored) return starterNotifications;
    const parsed = JSON.parse(stored) as NotificationItem[];
    return Array.isArray(parsed) ? parsed : starterNotifications;
  } catch {
    return starterNotifications;
  }
}

function loadTheme(): "theme-zen" | "theme-obsidian" | "theme-nordic" | "theme-sunset" {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) return stored as "theme-zen" | "theme-obsidian" | "theme-nordic" | "theme-sunset";
  } catch {}
  return "theme-zen";
}

function formatRelativeTime(timestamp: number) {
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function Home() {
  const [tasks, setTasks] = useState<FullTask[]>(loadTasks);
  const [notifications, setNotifications] = useState<NotificationItem[]>(loadNotifications);
  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile);
  const [theme, setTheme] = useState<"theme-zen" | "theme-obsidian" | "theme-nordic" | "theme-sunset">(loadTheme);
  const [view, setView] = useState<ViewMode>("today");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newCategory, setNewCategory] = useState<string>("work");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [editingTask, setEditingTask] = useState<FullTask | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [focusMinutesLogged, setFocusMinutesLogged] = useState(45);
  const [toast, setToast] = useState("");

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const pushNotification = (title: string, message: string, type: NotificationItem["type"] = "info") => {
    const item: NotificationItem = {
      id: crypto.randomUUID(),
      title,
      message,
      timestamp: Date.now(),
      read: false,
      type,
    };
    setNotifications((prev) => [item, ...prev]);
    setToast(title);
  };

  const markAllNotifsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markNotifRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifs = () => {
    setNotifications([]);
  };

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.completed).length;
    return { total: tasks.length, completed, pending: tasks.length - completed };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tasks
      .filter((task) => {
        if (view === "active") return !task.completed;
        if (view === "completed") return task.completed;
        return true;
      })
      .filter((task) => priorityFilter === "all" || task.priority === priorityFilter)
      .filter((task) => categoryFilter === "all" || task.category === categoryFilter)
      .filter((task) => !normalizedQuery || task.title.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt - a.createdAt);
  }, [tasks, view, priorityFilter, categoryFilter, query]);

  const addTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    soundFx.playClick();
    const newTask: FullTask = {
      id: crypto.randomUUID(),
      title,
      priority: newPriority,
      category: newCategory,
      estimatedMinutes: 25,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks((current) => [newTask, ...current]);
    setNewTitle("");
    pushNotification("Task Created", `"${title}" added to your workspace.`, "info");
  };

  const toggleTask = (id: string) => {
    soundFx.playClick();
    setTasks((current) =>
      current.map((task) => {
        if (task.id === id) {
          const nextCompleted = !task.completed;
          if (nextCompleted) {
            soundFx.playCompletionChime();
            triggerConfetti();
            pushNotification("Task Completed 🎉", `"${task.title}" wrapped up!`, "success");
          }
          return { ...task, completed: nextCompleted };
        }
        return task;
      })
    );
  };

  const deleteTask = (id: string) => {
    soundFx.playClick();
    const t = tasks.find((item) => item.id === id);
    setTasks((current) => current.filter((task) => task.id !== id));
    if (t) {
      pushNotification("Task Removed", `"${t.title}" deleted.`, "info");
    }
  };

  const saveEditedTask = (updated: FullTask) => {
    setTasks((current) => current.map((t) => (t.id === updated.id ? updated : t)));
    setEditingTask(null);
    pushNotification("Task Updated", `"${updated.title}" inspector saved.`, "info");
  };

  const clearCompleted = () => {
    if (!stats.completed) return;
    soundFx.playClick();
    setTasks((current) => current.filter((task) => !task.completed));
    pushNotification("List Cleared", "Completed tasks cleared from view.", "info");
  };

  const cycleTheme = () => {
    soundFx.playClick();
    const themes: Array<"theme-zen" | "theme-obsidian" | "theme-nordic" | "theme-sunset"> = [
      "theme-zen",
      "theme-obsidian",
      "theme-nordic",
      "theme-sunset",
    ];
    const nextIdx = (themes.indexOf(theme) + 1) % themes.length;
    const nextTheme = themes[nextIdx];
    setTheme(nextTheme);
    pushNotification("Theme Switched", `Active theme: ${nextTheme.replace("theme-", "")}`, "achievement");
  };

  const completionPercent = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="app-shell min-h-screen overflow-x-hidden">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div
          className="brand-lockup cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => {
            soundFx.playClick();
            setView("today");
            setCategoryFilter("all");
            setPriorityFilter("all");
          }}
          title="Return to Dashboard"
        >
          <div className="brand-mark">
            <img src="/favicon.png" alt="FocusList Logo" className="w-6 h-6 rounded-md object-cover" />
          </div>
          <div>
            <div className="brand-name">FocusList</div>
            <div className="brand-caption">Deep Work Suite</div>
          </div>
        </div>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="side-nav" aria-label="Workspace navigation">
          <button
            className={`side-link ${view === "today" ? "active" : ""}`}
            onClick={() => { soundFx.playClick(); setView("today"); }}
          >
            <Inbox size={17} /><span>Today</span><span className="side-count">{stats.pending}</span>
          </button>
          <button
            className={`side-link ${view === "active" ? "active" : ""}`}
            onClick={() => { soundFx.playClick(); setView("active"); }}
          >
            <Clock3 size={17} /><span>In progress</span>
          </button>
          <button
            className={`side-link ${view === "completed" ? "active" : ""}`}
            onClick={() => { soundFx.playClick(); setView("completed"); }}
          >
            <CheckCircle2 size={17} /><span>Completed</span><span className="side-count">{stats.completed}</span>
          </button>
        </nav>

        <div className="sidebar-section-label space-top">Focus & Analytics</div>
        <nav className="side-nav">
          <button
            className={`side-link ${view === "focus" ? "active" : ""}`}
            onClick={() => { soundFx.playClick(); setView("focus"); }}
          >
            <Flame size={17} className="text-orange-500" /><span>Pomodoro Timer</span>
          </button>
          <button
            className={`side-link ${view === "analytics" ? "active" : ""}`}
            onClick={() => { soundFx.playClick(); setView("analytics"); }}
          >
            <BarChart3 size={17} className="icon-green" /><span>Productivity Insights</span>
          </button>
          <button
            className={`side-link ${view === "profile" ? "active" : ""}`}
            onClick={() => { soundFx.playClick(); setView("profile"); }}
          >
            <UserIcon size={17} /><span>User Profile</span>
          </button>
        </nav>

        <div className="sidebar-section-label space-top">Categories</div>
        <nav className="side-nav">
          {(["all", "work", "personal", "health", "creative", "study"] as CategoryFilter[]).map((cat) => (
            <button
              key={cat}
              className={`side-link ${categoryFilter === cat ? "active" : ""}`}
              onClick={() => { soundFx.playClick(); setCategoryFilter(cat); setView("today"); }}
            >
              <Tag size={15} />
              <span>{cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="mini-progress-label"><span>Daily Momentum</span><strong>{completionPercent}%</strong></div>
          <div className="progress-track"><div className="progress-value" style={{ width: `${completionPercent}%` }} /></div>
          <button className="side-link settings-link" onClick={() => setIsCommandOpen(true)}>
            <Settings2 size={17} /><span>Command Bar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span
              className="cursor-pointer hover:text-coral-accent transition-colors"
              onClick={() => {
                soundFx.playClick();
                setView("today");
                setCategoryFilter("all");
                setPriorityFilter("all");
              }}
              title="Return to Dashboard"
            >
              FocusList
            </span>
            <span className="breadcrumb-slash">/</span>
            <strong>{view.toUpperCase()}</strong>
          </div>
          <div className="topbar-actions">
            {/* Notification Center Bell Badge */}
            <NotificationCenter
              notifications={notifications}
              onMarkAllRead={markAllNotifsRead}
              onClearAll={clearAllNotifs}
              onMarkRead={markNotifRead}
            />

            <button className="theme-select-btn" onClick={cycleTheme} title="Change Theme">
              <Palette size={15} />
              <span className="capitalize">{theme.replace("theme-", "")}</span>
            </button>

            <button className="command-bar-trigger" onClick={() => setIsCommandOpen(true)} title="Command Palette (Cmd+K)">
              <Search size={14} />
              <span>⌘K</span>
            </button>

            <button
              className="avatar-button cursor-pointer"
              onClick={() => { soundFx.playClick(); setView("profile"); }}
              title="Open User Profile"
            >
              {userProfile.avatarInitials}
            </button>
          </div>
        </header>

        <div className="content-wrap">
          {/* TODAY VIEW / TASK LIST VIEW */}
          {(view === "today" || view === "active" || view === "completed") && (
            <>
              <section className="welcome-row">
                <div>
                  <p className="eyebrow"><CalendarDays size={14} /> Thursday, September 19</p>
                  <h1>Focus on <em>what matters.</em></h1>
                  <p className="intro-copy">Your clear daily workspace. One intentional step at a time.</p>
                </div>
                <div className="focus-note">
                  <div className="focus-note-icon"><ArrowUp size={15} /></div>
                  <div>
                    <strong>Focus Momentum</strong>
                    <span>{stats.pending ? `${stats.pending} active tasks in your workspace` : "All tasks wrapped up!"}</span>
                  </div>
                </div>
              </section>

              {/* Stats KPI */}
              <section className="stats-grid">
                <div className="stat-card stat-total">
                  <div className="stat-card-top"><span className="stat-label">Total Tasks</span><ListTodo size={18} /></div>
                  <div className="stat-number">{stats.total}</div>
                  <span className="stat-detail">On your agenda</span>
                </div>
                <div className="stat-card stat-complete">
                  <div className="stat-card-top"><span className="stat-label">Completed</span><CheckCircle2 size={18} /></div>
                  <div className="stat-number">{stats.completed}</div>
                  <span className="stat-detail">{completionPercent}% completion rate</span>
                </div>
                <div className="stat-card stat-pending">
                  <div className="stat-card-top"><span className="stat-label">Pending</span><Clock3 size={18} /></div>
                  <div className="stat-number">{stats.pending}</div>
                  <span className="stat-detail">Ready to focus</span>
                </div>
              </section>

              {/* Task Panel */}
              <section className="task-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Today’s Focus List</h2>
                    <p>{filteredTasks.length === stats.total ? "All your tasks in one calm, focused list." : `Filtered: ${filteredTasks.length} matching tasks.`}</p>
                  </div>
                  <button className="clear-button" onClick={clearCompleted} disabled={!stats.completed}>
                    Clear completed
                  </button>
                </div>

                {/* Quick Add */}
                <form className="quick-add" onSubmit={addTask}>
                  <div className="quick-add-icon"><Plus size={18} /></div>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Add a new task or priority focus..."
                  />
                  <div className="category-select-wrap">
                    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                      <option value="work">Work 💼</option>
                      <option value="personal">Personal 🏠</option>
                      <option value="health">Health 🌿</option>
                      <option value="creative">Creative 🎨</option>
                      <option value="study">Study 📚</option>
                    </select>
                  </div>
                  <div className="priority-select-wrap">
                    <span className={`priority-dot ${priorityConfig[newPriority].dot}`} />
                    <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as Priority)}>
                      <option value="high">High priority</option>
                      <option value="medium">Medium priority</option>
                      <option value="low">Low priority</option>
                    </select>
                    <ChevronDown size={14} />
                  </div>
                  <button className="add-button" type="submit">Add Task</button>
                </form>

                {/* Toolbar Filter */}
                <div className="toolbar">
                  <div className="filter-tabs">
                    {(["today", "active", "completed"] as ViewMode[]).map((v) => (
                      <button
                        key={v}
                        className={`filter-tab ${view === v ? "selected" : ""}`}
                        onClick={() => setView(v)}
                      >
                        {v === "today" ? "All" : v.charAt(0).toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="toolbar-right">
                    <div className="priority-filter-select-wrap">
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                        className="priority-filter-dropdown"
                        aria-label="Filter tasks by priority"
                      >
                        <option value="all">All Priorities</option>
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                      <ChevronDown size={13} />
                    </div>

                    <div className="search-wrap">
                      <Search size={15} />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tasks..."
                        aria-label="Search tasks by title"
                      />
                      {query && (
                        <button className="clear-search" onClick={() => setQuery("")} aria-label="Clear search"><X size={13} /></button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Task List */}
                <div className="task-list">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => {
                      const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
                      const totalSubtasks = task.subtasks?.length || 0;

                      return (
                        <article key={task.id} className={`task-row ${task.completed ? "completed-row" : ""}`}>
                          <button
                            className={`task-check ${task.completed ? "checked" : ""}`}
                            onClick={() => toggleTask(task.id)}
                          >
                            {task.completed && <Check size={14} strokeWidth={3} />}
                          </button>

                          <div className="task-copy">
                            <div className="task-title-line">
                              <span className="task-title">{task.title}</span>

                              {task.category && categoryBadgeConfig[task.category] && (
                                <span className={`tag-badge ${categoryBadgeConfig[task.category].className}`}>
                                  {categoryBadgeConfig[task.category].label}
                                </span>
                              )}

                              <span className={`priority-pill ${priorityConfig[task.priority].className}`}>
                                <span className={`priority-dot ${priorityConfig[task.priority].dot}`} />
                                {priorityConfig[task.priority].label}
                              </span>
                            </div>

                            <div className="task-meta-row">
                              <span>Added {formatRelativeTime(task.createdAt)}</span>
                              {task.estimatedMinutes && (
                                <span>• ⏱️ {task.estimatedMinutes}m est</span>
                              )}
                              {totalSubtasks > 0 && (
                                <span className="subtask-mini-progress">
                                  • <CheckSquare size={12} /> {completedSubtasks}/{totalSubtasks} subtasks
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="task-actions">
                            <button
                              onClick={() => {
                                soundFx.playClick();
                                setView("focus");
                              }}
                              title="Focus on this task"
                            >
                              <Flame size={15} className="text-orange-500" />
                            </button>
                            <button onClick={() => setEditingTask(task)} title="Inspect / Edit task">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => deleteTask(task.id)} title="Delete task">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="empty-state">
                      <p>No matching tasks found in this view.</p>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* FOCUS TIMER VIEW */}
          {view === "focus" && (
            <FocusTimer
              tasks={tasks}
              onCompleteTask={(taskId) => toggleTask(taskId)}
              onLogFocusMinutes={(mins) => {
                setFocusMinutesLogged((prev) => prev + mins);
                pushNotification("Focus Completed", `Logged ${mins} minutes of deep work!`, "achievement");
              }}
            />
          )}

          {/* ANALYTICS VIEW */}
          {view === "analytics" && (
            <AnalyticsDashboard tasks={tasks} focusMinutesTotal={focusMinutesLogged} />
          )}

          {/* USER PROFILE VIEW */}
          {view === "profile" && (
            <ProfileSection
              onSaveProfile={(up) => {
                setUserProfile(up);
                pushNotification("Profile Updated", "Your user profile details have been saved.", "info");
              }}
              totalCompletedTasks={stats.completed}
              focusMinutesTotal={focusMinutesLogged}
            />
          )}

          <footer className="page-footer mt-8">
            <span><Sparkles size={13} /> FocusList operates 100% offline & locally on your machine.</span>
            <span className="keyboard-tip"><kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> to open Command Palette</span>
          </footer>
        </div>
      </main>

      {/* Task Inspector Modal */}
      {editingTask && (
        <TaskDetailModal
          task={editingTask}
          onSave={saveEditedTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={(v) => setView(v)}
        onSetTheme={(t) => cycleTheme()}
        onOpenNewTask={() => setView("today")}
        onClearCompleted={clearCompleted}
      />

      {/* Subtle Floating Toast Notification Pill */}
      {toast && (
        <div className="toast-floating-container">
          <div className="toast-floating-pill">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span>{toast}</span>
            <button className="ml-auto opacity-60 hover:opacity-100" onClick={() => setToast("")}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
