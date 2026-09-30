import { useCallback, useEffect, useState } from 'react';

export function useTodos(store) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    store
      .list()
      .then((data) => !cancelled && setTodos(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [store]);

  // Runs a store call and surfaces its error in the UI instead of throwing.
  const run = useCallback(async (action) => {
    try {
      setError(null);
      await action();
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const add = (title) =>
    run(async () => {
      const todo = await store.create(title);
      setTodos((prev) => [...prev, todo]);
    });

  const update = (id, changes) =>
    run(async () => {
      const todo = await store.update(id, changes);
      setTodos((prev) => prev.map((t) => (t.id === id ? todo : t)));
    });

  const remove = (id) =>
    run(async () => {
      await store.remove(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    });

  const clearCompleted = () =>
    run(async () => {
      await store.clearCompleted();
      setTodos((prev) => prev.filter((t) => !t.completed));
    });

  return { todos, loading, error, add, update, remove, clearCompleted };
}
