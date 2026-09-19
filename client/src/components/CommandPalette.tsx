import { useEffect, useState } from "react";
import {
  Search,
  Sparkles,
  Clock,
  CheckCircle2,
  BarChart3,
  Moon,
  Sun,
  Palette,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  X,
  Keyboard,
} from "lucide-react";
import { soundFx } from "../lib/soundEffects";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: "today" | "active" | "completed" | "focus" | "analytics") => void;
  onSetTheme: (theme: "theme-zen" | "theme-obsidian" | "theme-nordic" | "theme-sunset") => void;
  onOpenNewTask: () => void;
  onClearCompleted: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onSetTheme,
  onOpenNewTask,
  onClearCompleted,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setQuery("");
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: "nav-today",
      title: "Go to Today's Tasks",
      icon: <Sparkles size={16} />,
      category: "Navigation",
      run: () => onNavigate("today"),
    },
    {
      id: "nav-focus",
      title: "Open Pomodoro Focus Timer",
      icon: <Clock size={16} />,
      category: "Navigation",
      run: () => onNavigate("focus"),
    },
    {
      id: "nav-analytics",
      title: "View Productivity Analytics",
      icon: <BarChart3 size={16} />,
      category: "Navigation",
      run: () => onNavigate("analytics"),
    },
    {
      id: "action-new-task",
      title: "Create New Task",
      icon: <Plus size={16} />,
      category: "Actions",
      run: () => onOpenNewTask(),
    },
    {
      id: "theme-obsidian",
      title: "Switch Theme: Obsidian Dark (OLED)",
      icon: <Moon size={16} />,
      category: "Themes",
      run: () => onSetTheme("theme-obsidian"),
    },
    {
      id: "theme-zen",
      title: "Switch Theme: Zen Cream (Warm Paper)",
      icon: <Sun size={16} />,
      category: "Themes",
      run: () => onSetTheme("theme-zen"),
    },
    {
      id: "theme-nordic",
      title: "Switch Theme: Nordic Emerald (Dark Green)",
      icon: <Palette size={16} />,
      category: "Themes",
      run: () => onSetTheme("theme-nordic"),
    },
    {
      id: "theme-sunset",
      title: "Switch Theme: Sunset Twilight (Rose Violet)",
      icon: <Palette size={16} />,
      category: "Themes",
      run: () => onSetTheme("theme-sunset"),
    },
    {
      id: "action-clear",
      title: "Clear Completed Tasks",
      icon: <Trash2 size={16} />,
      category: "Actions",
      run: () => onClearCompleted(),
    },
  ];

  const filtered = actions.filter((act) =>
    act.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div
      className="command-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="command-dialog">
        <div className="command-input-wrap">
          <Search size={18} className="command-search-icon" />
          <input
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="command-input"
            autoFocus
          />
          <button className="command-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="command-list">
          {filtered.length > 0 ? (
            filtered.map((act) => (
              <button
                key={act.id}
                className="command-item"
                onClick={() => {
                  soundFx.playClick();
                  act.run();
                  onClose();
                }}
              >
                <div className="command-item-left">
                  {act.icon}
                  <span>{act.title}</span>
                </div>
                <span className="command-badge">{act.category}</span>
              </button>
            ))
          ) : (
            <div className="command-empty">No matching commands found</div>
          )}
        </div>

        <div className="command-footer">
          <span><Keyboard size={12} /> Use <strong>⌘K</strong> / <strong>Ctrl+K</strong> to open anytime</span>
        </div>
      </div>
    </div>
  );
}
