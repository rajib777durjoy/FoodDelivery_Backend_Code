
import { sql } from 'drizzle-orm';
import { pgTable, varchar, text, timestamp, integer, serial} from 'drizzle-orm/pg-core';

export const users_table = pgTable('users_table', {
  id:serial('id').primaryKey(),
  fullname: varchar('fullname', { length: 255 }),
  email: varchar('email', { length: 255 }),
  profile: text('profile').default(""),
  role: text('role').default('customer'),
  createdAt: timestamp('created_at').defaultNow()
});
