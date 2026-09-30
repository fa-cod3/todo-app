const COLUMNS = 'id, title, completed, created_at, updated_at';

function toTodo(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const STATUS_FILTERS = {
  all: '',
  active: 'WHERE completed = FALSE',
  completed: 'WHERE completed = TRUE',
};

function createTodoRepository(db) {
  return {
    async list(status = 'all') {
      const { rows } = await db.query(
        `SELECT ${COLUMNS} FROM todos ${STATUS_FILTERS[status]} ORDER BY id`
      );
      return rows.map(toTodo);
    },

    async create(title) {
      const { rows } = await db.query(
        `INSERT INTO todos (title) VALUES ($1) RETURNING ${COLUMNS}`,
        [title]
      );
      return toTodo(rows[0]);
    },

    // Only the fields that are defined get updated.
    async update(id, { title, completed }) {
      const fields = { title, completed };
      const sets = [];
      const values = [];
      for (const [column, value] of Object.entries(fields)) {
        if (value !== undefined) {
          values.push(value);
          sets.push(`${column} = $${values.length}`);
        }
      }
      values.push(id);
      const { rows } = await db.query(
        `UPDATE todos SET ${sets.join(', ')}, updated_at = NOW()
         WHERE id = $${values.length}
         RETURNING ${COLUMNS}`,
        values
      );
      return toTodo(rows[0]);
    },

    async remove(id) {
      const { rowCount } = await db.query('DELETE FROM todos WHERE id = $1', [id]);
      return rowCount > 0;
    },

    async removeCompleted() {
      const { rowCount } = await db.query('DELETE FROM todos WHERE completed = TRUE');
      return rowCount;
    },
  };
}

module.exports = { createTodoRepository };
