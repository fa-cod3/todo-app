// Two interchangeable stores with the same interface:
// - createHttpStore talks to the Express API (default)
// - createLocalStore keeps todos in localStorage (VITE_DEMO_MODE=true, used for the live demo)

export function createHttpStore(baseUrl = '', fetchImpl = (...args) => fetch(...args)) {
  async function request(path, options = {}) {
    const res = await fetchImpl(`${baseUrl}/api/todos${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (res.status === 204) return null;
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
    return body;
  }

  return {
    async list() {
      return (await request('')).data;
    },
    async create(title) {
      return (await request('', { method: 'POST', body: JSON.stringify({ title }) })).todo;
    },
    async update(id, changes) {
      return (await request(`/${id}`, { method: 'PATCH', body: JSON.stringify(changes) })).todo;
    },
    async remove(id) {
      await request(`/${id}`, { method: 'DELETE' });
    },
    async clearCompleted() {
      await request('/completed', { method: 'DELETE' });
    },
  };
}

const STORAGE_KEY = 'fa-code-todos';

export function createLocalStore(storage = window.localStorage) {
  const load = () => {
    try {
      return JSON.parse(storage.getItem(STORAGE_KEY)) ?? [];
    } catch {
      return [];
    }
  };
  const save = (todos) => storage.setItem(STORAGE_KEY, JSON.stringify(todos));
  const nextId = (todos) => todos.reduce((max, t) => Math.max(max, t.id), 0) + 1;

  return {
    async list() {
      return load();
    },
    async create(title) {
      const todos = load();
      const now = new Date().toISOString();
      const todo = { id: nextId(todos), title: title.trim(), completed: false, createdAt: now, updatedAt: now };
      save([...todos, todo]);
      return todo;
    },
    async update(id, changes) {
      const todos = load();
      const index = todos.findIndex((t) => t.id === id);
      if (index === -1) throw new Error('Todo not found');
      const todo = { ...todos[index], ...changes, updatedAt: new Date().toISOString() };
      todos[index] = todo;
      save(todos);
      return todo;
    },
    async remove(id) {
      save(load().filter((t) => t.id !== id));
    },
    async clearCompleted() {
      save(load().filter((t) => !t.completed));
    },
  };
}

export function createDefaultStore() {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return createLocalStore();
  return createHttpStore(import.meta.env.VITE_API_URL ?? '');
}
