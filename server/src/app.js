const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createTodoRepository } = require('./repositories/todoRepository');
const { todosRouter } = require('./routes/todos');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp({ db, corsOrigin = '*' }) {
  const app = express();
  const todos = createTodoRepository(db);

  app.use(helmet());
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', async (req, res) => {
    await db.query('SELECT 1');
    res.json({ status: 'ok' });
  });

  app.use('/api/todos', todosRouter({ todos }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
