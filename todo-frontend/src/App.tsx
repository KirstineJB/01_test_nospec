import { useEffect, useState, useRef } from "react";
import { api } from "./api";
import type { TodoItem } from "./types";
import "./App.css";

type Filter = "all" | "active" | "completed";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16">
      <polyline points="2.5,8.5 6.5,12.5 13.5,4.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

interface TodoCardProps {
  todo: TodoItem;
  onToggle: (id: number) => void;
  onUpdate: (id: number, title: string, description: string) => void;
  onDelete: (id: number) => void;
}

function TodoCard({ todo, onToggle, onUpdate, onDelete }: TodoCardProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDesc, setEditDesc] = useState(todo.description ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setEditTitle(todo.title);
    setEditDesc(todo.description ?? "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function saveEdit() {
    if (!editTitle.trim()) return;
    onUpdate(todo.id, editTitle, editDesc);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === "Escape") cancelEdit();
  }

  return (
    <div className={`todo-card ${todo.isCompleted ? "completed" : ""}`}>
      <button
        className={`checkbox-btn ${todo.isCompleted ? "checked" : ""}`}
        onClick={() => onToggle(todo.id)}
        title={todo.isCompleted ? "Mark as active" : "Mark as complete"}
      >
        <CheckIcon />
      </button>

      <div className="todo-content">
        {editing ? (
          <div className="edit-form">
            <input
              ref={inputRef}
              className="input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Task title"
            />
            <textarea
              className="input-desc"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Description (optional)"
            />
            <div className="edit-actions">
              <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>
              <button
                className="btn-save"
                onClick={saveEdit}
                disabled={!editTitle.trim()}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="todo-title">{todo.title}</div>
            {todo.description && (
              <div className="todo-description">{todo.description}</div>
            )}
            <div className="todo-meta">
              <span className="todo-date">{formatDate(todo.createdAt)}</span>
              {todo.isCompleted && <span className="badge-done">Done</span>}
            </div>
          </>
        )}
      </div>

      {!editing && (
        <div className="todo-actions">
          <button className="icon-btn" onClick={startEdit} title="Edit">
            <EditIcon />
          </button>
          <button
            className="icon-btn danger"
            onClick={() => onDelete(todo.id)}
            title="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="skeleton-list">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line title" />
          <div className="skeleton-line desc" />
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [showDesc, setShowDesc] = useState(false);

  useEffect(() => {
    loadTodos();
  }, []);

  async function loadTodos() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAll();
      setTodos(data);
    } catch {
      setError("Failed to connect to the API. Make sure the backend is running on port 5227.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setAdding(true);
      const created = await api.create({ title: newTitle, description: newDesc || undefined });
      setTodos((prev) => [created, ...prev]);
      setNewTitle("");
      setNewDesc("");
      setShowDesc(false);
    } catch {
      setError("Failed to add task.");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(id: number) {
    try {
      const updated = await api.toggle(id);
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      setError("Failed to update task.");
    }
  }

  async function handleUpdate(id: number, title: string, description: string) {
    try {
      const updated = await api.update(id, { title, description: description || undefined });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      setError("Failed to save changes.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Failed to delete task.");
    }
  }

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.isCompleted;
    if (filter === "completed") return t.isCompleted;
    return true;
  });

  const activeCount = todos.filter((t) => !t.isCompleted).length;
  const completedCount = todos.filter((t) => t.isCompleted).length;

  return (
    <div className="app">
      <header className="header">
        <h1>My <span>Tasks</span></h1>
        <p>Stay organised, one task at a time.</p>
      </header>

      <main className="container">
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <form className="add-form" onSubmit={handleAdd}>
          <h2>New task</h2>
          <div className="form-row">
            <input
              className="input"
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onFocus={() => setShowDesc(true)}
            />
            <button className="btn-add" type="submit" disabled={adding || !newTitle.trim()}>
              {adding ? "Adding…" : "Add"}
            </button>
          </div>
          {showDesc && (
            <textarea
              className="input-desc"
              placeholder="Add a description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          )}
        </form>

        <div className="filter-bar">
          {(["all", "active", "completed"] as Filter[]).map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span className="filter-count">
            {activeCount} remaining · {completedCount} done
          </span>
        </div>

        {loading ? (
          <SkeletonLoader />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {filter === "completed" ? "✓" : filter === "active" ? "🎉" : "📋"}
            </div>
            <p>
              {filter === "completed"
                ? "No completed tasks yet"
                : filter === "active"
                ? "All tasks completed!"
                : "No tasks yet"}
            </p>
            <span>
              {filter === "all"
                ? "Add your first task above to get started."
                : "Switch to a different filter to see more."}
            </span>
          </div>
        ) : (
          <div className="todo-list">
            {filtered.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
