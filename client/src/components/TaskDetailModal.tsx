import { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Check,
  Calendar,
  Clock,
  Tag,
  ChevronDown,
  Sparkles,
  FileText,
} from "lucide-react";
import { soundFx } from "../lib/soundEffects";

export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type FullTask = {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  category?: string;
  estimatedMinutes?: number;
  dueDate?: string;
  notes?: string;
  subtasks?: Subtask[];
  completed: boolean;
  createdAt: number;
};

interface TaskDetailModalProps {
  task: FullTask;
  onSave: (updated: FullTask) => void;
  onClose: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "work", label: "Work 💼" },
  { value: "personal", label: "Personal 🏠" },
  { value: "health", label: "Health 🌿" },
  { value: "creative", label: "Creative 🎨" },
  { value: "study", label: "Study 📚" },
];

export default function TaskDetailModal({ task, onSave, onClose }: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<"high" | "medium" | "low">(task.priority);
  const [category, setCategory] = useState(task.category || "work");
  const [estimatedMinutes, setEstimatedMinutes] = useState(task.estimatedMinutes || 25);
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [notes, setNotes] = useState(task.notes || "");
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    const t = newSubtaskTitle.trim();
    if (!t) return;
    soundFx.playClick();
    setSubtasks((prev) => [...prev, { id: crypto.randomUUID(), title: t, completed: false }]);
    setNewSubtaskTitle("");
  };

  const toggleSubtask = (id: string) => {
    soundFx.playClick();
    setSubtasks((prev) =>
      prev.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const deleteSubtask = (id: string) => {
    soundFx.playClick();
    setSubtasks((prev) => prev.filter((st) => st.id !== id));
  };

  const completedSubtasksCount = subtasks.filter((st) => st.completed).length;
  const subtaskProgress = subtasks.length
    ? Math.round((completedSubtasksCount / subtasks.length) * 100)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    soundFx.playClick();
    onSave({
      ...task,
      title: title.trim(),
      priority,
      category,
      estimatedMinutes,
      dueDate,
      notes,
      subtasks,
    });
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="task-detail-modal">
        <div className="detail-modal-header">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-coral" />
            <h2 className="modal-title">Task Inspector</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="detail-modal-body">
          {/* Main Title */}
          <div className="form-group">
            <label className="form-label">Task Name</label>
            <input
              type="text"
              className="title-input-large"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>

          {/* Properties Grid */}
          <div className="props-grid">
            <div className="form-group">
              <label className="form-label"><Tag size={12} /> Category</label>
              <div className="select-wrapper">
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="select-arrow" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <div className="select-wrapper">
                <select value={priority} onChange={(e) => setPriority(e.target.value as "high" | "medium" | "low")}>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <ChevronDown size={14} className="select-arrow" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><Clock size={12} /> Est. Duration</label>
              <div className="select-wrapper">
                <select
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(parseInt(e.target.value))}
                >
                  <option value={15}>15 mins</option>
                  <option value={25}>25 mins (1 Pomodoro)</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins (1 hr)</option>
                  <option value={90}>90 mins</option>
                </select>
                <ChevronDown size={14} className="select-arrow" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><Calendar size={12} /> Due Date</label>
              <input
                type="date"
                className="date-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div className="subtasks-section">
            <div className="subtasks-header">
              <span className="subtasks-title">Subtasks Checklist</span>
              {subtasks.length > 0 && (
                <span className="subtasks-counter">
                  {completedSubtasksCount} of {subtasks.length} done ({subtaskProgress}%)
                </span>
              )}
            </div>

            {subtasks.length > 0 && (
              <div className="subtask-progress-bar">
                <div
                  className="subtask-progress-fill"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
            )}

            <div className="subtask-list">
              {subtasks.map((st) => (
                <div key={st.id} className={`subtask-item ${st.completed ? "completed" : ""}`}>
                  <button
                    type="button"
                    className={`subtask-checkbox ${st.completed ? "checked" : ""}`}
                    onClick={() => toggleSubtask(st.id)}
                  >
                    {st.completed && <Check size={12} strokeWidth={3} />}
                  </button>
                  <span className="subtask-text">{st.title}</span>
                  <button
                    type="button"
                    className="subtask-delete"
                    onClick={() => deleteSubtask(st.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="add-subtask-form">
              <input
                type="text"
                placeholder="Add a step to break down this task..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
              />
              <button type="button" onClick={handleAddSubtask} className="add-subtask-btn">
                <Plus size={15} /> Add
              </button>
            </div>
          </div>

          {/* Notes area */}
          <div className="form-group">
            <label className="form-label"><FileText size={12} /> Notes & Context</label>
            <textarea
              className="notes-textarea"
              placeholder="Add key context, links, or thoughts for this task..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-actions-bar">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
