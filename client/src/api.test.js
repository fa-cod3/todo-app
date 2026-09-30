import { describe, expect, test, vi } from 'vitest';
import { createHttpStore } from './api';

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe('createHttpStore', () => {
  test('calls the REST endpoints', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: [] }))
      .mockResolvedValueOnce(jsonResponse(201, { todo: { id: 1, title: 'A' } }))
      .mockResolvedValueOnce(jsonResponse(200, { todo: { id: 1, completed: true } }))
      .mockResolvedValueOnce(jsonResponse(204))
      .mockResolvedValueOnce(jsonResponse(200, { deleted: 0 }));
    const store = createHttpStore('http://api.test', fetch);

    await store.list();
    await store.create('A');
    await store.update(1, { completed: true });
    await store.remove(1);
    await store.clearCompleted();

    expect(fetch.mock.calls.map(([url, opts]) => [opts.method ?? 'GET', url])).toEqual([
      ['GET', 'http://api.test/api/todos'],
      ['POST', 'http://api.test/api/todos'],
      ['PATCH', 'http://api.test/api/todos/1'],
      ['DELETE', 'http://api.test/api/todos/1'],
      ['DELETE', 'http://api.test/api/todos/completed'],
    ]);
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ title: 'A' });
  });

  test('throws the API error message', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(404, { error: 'Todo not found' }));
    const store = createHttpStore('', fetch);

    await expect(store.update(9, { completed: true })).rejects.toThrow('Todo not found');
  });
});
