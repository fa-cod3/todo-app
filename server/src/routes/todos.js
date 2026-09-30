const express = require('express');
const { validate } = require('../middleware/validate');
const { HttpError } = require('../errors');
const {
  createTodoSchema,
  updateTodoSchema,
  idParamSchema,
  listQuerySchema,
} = require('../schemas');

function todosRouter({ todos }) {
  const router = express.Router();

  router.get('/', validate(listQuerySchema, 'query'), async (req, res) => {
    res.json({ data: await todos.list(req.query.status) });
  });

  router.post('/', validate(createTodoSchema), async (req, res) => {
    res.status(201).json({ todo: await todos.create(req.body.title) });
  });

  // Declared before /:id so "completed" is not parsed as an id.
  router.delete('/completed', async (req, res) => {
    res.json({ deleted: await todos.removeCompleted() });
  });

  router.patch(
    '/:id',
    validate(idParamSchema, 'params'),
    validate(updateTodoSchema),
    async (req, res) => {
      const todo = await todos.update(req.params.id, req.body);
      if (!todo) throw new HttpError(404, 'Todo not found');
      res.json({ todo });
    }
  );

  router.delete('/:id', validate(idParamSchema, 'params'), async (req, res) => {
    const deleted = await todos.remove(req.params.id);
    if (!deleted) throw new HttpError(404, 'Todo not found');
    res.status(204).end();
  });

  return router;
}

module.exports = { todosRouter };
