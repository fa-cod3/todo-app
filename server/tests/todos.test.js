const request = require('supertest');
const { newDb } = require('pg-mem');
const { createApp } = require('../src/app');
const { migrate } = require('../src/db/migrate');

describe('todos API', () => {
  let app;

  beforeEach(async () => {
    const { Pool } = newDb().adapters.createPg();
    const db = new Pool();
    await migrate(db);
    app = createApp({ db });
  });

  const create = (title) => request(app).post('/api/todos').send({ title });

  test('health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('starts empty', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });

  test('creates a todo with a trimmed title', async () => {
    const res = await create('  Buy milk  ');

    expect(res.status).toBe(201);
    expect(res.body.todo).toMatchObject({ id: expect.any(Number), title: 'Buy milk', completed: false });
  });

  test.each([
    ['empty title', { title: '   ' }],
    ['missing title', {}],
    ['too long title', { title: 'x'.repeat(201) }],
    ['unknown fields', { title: 'ok', completed: true }],
  ])('rejects %s', async (_, body) => {
    const res = await request(app).post('/api/todos').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  test('rejects malformed JSON', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Content-Type', 'application/json')
      .send('{"title":');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid JSON body');
  });

  test('lists todos in creation order and filters by status', async () => {
    const first = (await create('First')).body.todo;
    await create('Second');
    await request(app).patch(`/api/todos/${first.id}`).send({ completed: true });

    const all = await request(app).get('/api/todos');
    const active = await request(app).get('/api/todos?status=active');
    const completed = await request(app).get('/api/todos?status=completed');

    expect(all.body.data.map((t) => t.title)).toEqual(['First', 'Second']);
    expect(active.body.data.map((t) => t.title)).toEqual(['Second']);
    expect(completed.body.data.map((t) => t.title)).toEqual(['First']);
  });

  test('rejects an invalid status filter', async () => {
    const res = await request(app).get('/api/todos?status=done');
    expect(res.status).toBe(400);
  });

  test('updates title and completed state', async () => {
    const { id } = (await create('Draft')).body.todo;

    const renamed = await request(app).patch(`/api/todos/${id}`).send({ title: 'Final' });
    expect(renamed.status).toBe(200);
    expect(renamed.body.todo).toMatchObject({ title: 'Final', completed: false });

    const done = await request(app).patch(`/api/todos/${id}`).send({ completed: true });
    expect(done.body.todo).toMatchObject({ title: 'Final', completed: true });
  });

  test('rejects invalid updates', async () => {
    const { id } = (await create('Task')).body.todo;

    const empty = await request(app).patch(`/api/todos/${id}`).send({});
    const wrongType = await request(app).patch(`/api/todos/${id}`).send({ completed: 'yes' });
    const badId = await request(app).patch('/api/todos/abc').send({ completed: true });

    expect(empty.status).toBe(400);
    expect(wrongType.status).toBe(400);
    expect(badId.status).toBe(400);
  });

  test('returns 404 when updating a missing todo', async () => {
    const res = await request(app).patch('/api/todos/999').send({ completed: true });
    expect(res.status).toBe(404);
  });

  test('deletes a todo', async () => {
    const { id } = (await create('Temp')).body.todo;

    const res = await request(app).delete(`/api/todos/${id}`);
    expect(res.status).toBe(204);

    const again = await request(app).delete(`/api/todos/${id}`);
    expect(again.status).toBe(404);
  });

  test('clears completed todos', async () => {
    const a = (await create('A')).body.todo;
    const b = (await create('B')).body.todo;
    await create('C');
    await request(app).patch(`/api/todos/${a.id}`).send({ completed: true });
    await request(app).patch(`/api/todos/${b.id}`).send({ completed: true });

    const res = await request(app).delete('/api/todos/completed');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: 2 });

    const remaining = await request(app).get('/api/todos');
    expect(remaining.body.data.map((t) => t.title)).toEqual(['C']);
  });

  test('unknown routes return 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/);
  });
});
