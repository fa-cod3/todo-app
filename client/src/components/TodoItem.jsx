import { useState } from 'react';

export function TodoItem({ todo, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);

  const startEditing = () => {
    setDraft(todo.title);
    setEditing(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed) return onRemove(todo.id);
    if (trimmed !== todo.title) onUpdate(todo.id, { title: trimmed });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') commit();
    if (event.key === 'Escape') setEditing(false);
  };

  return (
    <li className="group flex items-center gap-3 border-b border-slate-800 px-4 py-3 last:border-b-0">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onUpdate(todo.id, { completed: !todo.completed })}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'active' : 'completed'}`}
        className="h-5 w-5 shrink-0 cursor-pointer accent-brand"
      />

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          aria-label="Edit todo"
          maxLength={200}
          className="flex-1 rounded border border-brand bg-slate-900 px-2 py-1 text-slate-100 outline-none"
        />
      ) : (
        <span
          onDoubleClick={startEditing}
          title="Double-click to edit"
          className={`flex-1 cursor-text break-words ${todo.completed ? 'text-slate-500 line-through' : 'text-slate-100'}`}
        >
          {todo.title}
        </span>
      )}

      {!editing && (
        <div className="flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <button
            onClick={startEditing}
            aria-label={`Edit "${todo.title}"`}
            className="rounded px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            Edit
          </button>
          <button
            onClick={() => onRemove(todo.id)}
            aria-label={`Delete "${todo.title}"`}
            className="rounded px-2 py-1 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400"
          >
            Delete
          </button>
        </div>
      )}
    </li>
  );
}
