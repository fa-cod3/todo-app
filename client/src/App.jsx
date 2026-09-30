import { useMemo, useState } from 'react';
import { createDefaultStore } from './api';
import { useTodos } from './useTodos';
import { TodoForm } from './components/TodoForm';
import { TodoItem } from './components/TodoItem';

const FILTERS = {
  all: () => true,
  active: (todo) => !todo.completed,
  completed: (todo) => todo.completed,
};

const defaultStore = createDefaultStore();

export default function App({ store = defaultStore }) {
  const { todos, loading, error, add, update, remove, clearCompleted } = useTodos(store);
  const [filter, setFilter] = useState('all');

  const visible = useMemo(() => todos.filter(FILTERS[filter]), [todos, filter]);
  const activeCount = todos.filter(FILTERS.active).length;
  const completedCount = todos.length - activeCount;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-12 sm:py-20">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-100">
          Todo<span className="text-brand">.</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">React · Node.js · PostgreSQL</p>
      </header>

      <TodoForm onAdd={add} />

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
        {loading ? (
          <p className="px-4 py-8 text-center text-slate-500">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-slate-500">
            {todos.length === 0 ? 'Nothing to do yet. Add your first task above.' : `No ${filter} tasks.`}
          </p>
        ) : (
          <ul>
            {visible.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onUpdate={update} onRemove={remove} />
            ))}
          </ul>
        )}

        {todos.length > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 text-sm text-slate-400">
            <span>
              {activeCount} {activeCount === 1 ? 'item' : 'items'} left
            </span>
            <nav className="flex gap-1" aria-label="Filter todos">
              {Object.keys(FILTERS).map((name) => (
                <button
                  key={name}
                  onClick={() => setFilter(name)}
                  aria-pressed={filter === name}
                  className={`rounded px-2 py-1 capitalize ${
                    filter === name ? 'bg-brand/15 text-brand' : 'hover:text-slate-100'
                  }`}
                >
                  {name}
                </button>
              ))}
            </nav>
            <button
              onClick={clearCompleted}
              disabled={completedCount === 0}
              className="hover:text-slate-100 disabled:invisible"
            >
              Clear completed
            </button>
          </footer>
        )}
      </section>

      <p className="mt-6 text-center text-xs text-slate-600">Double-click a task to edit it</p>

      <footer className="mt-auto pt-12 text-center text-xs text-slate-500">
        Built by{' '}
        <a href="https://fa-cod3.vercel.app" className="text-brand hover:underline">
          FA Code
        </a>{' '}
        ·{' '}
        <a href="https://github.com/fa-cod3/todo-app" className="text-brand hover:underline">
          Source on GitHub
        </a>
      </footer>
    </main>
  );
}
