const { z } = require('zod');

const title = z.string().trim().min(1, 'Title is required').max(200);

const createTodoSchema = z.object({ title }).strict();

const updateTodoSchema = z
  .object({ title, completed: z.boolean() })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update');

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

const listQuerySchema = z.object({
  status: z.enum(['all', 'active', 'completed']).default('all'),
});

module.exports = { createTodoSchema, updateTodoSchema, idParamSchema, listQuerySchema };
