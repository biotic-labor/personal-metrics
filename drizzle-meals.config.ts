import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './drizzle/meals-schema.ts',
  out: './drizzle/meals-migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/meals.db',
  },
});
