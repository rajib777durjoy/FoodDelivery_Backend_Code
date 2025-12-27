import { boolean, integer, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { users_table } from "./userModel.js";

export const delivery_table = pgTable('delivery_table', {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').references(() => users_table.id, { onUpdate: "cascade", onDelete: "cascade" }),
    name: varchar('name', { length: 225 }),
    email: varchar('email', { length: 225 }),
    location: text('location'),
    address: text('address'),
    active: boolean('active').default(true),
    ride: varchar('ride', { length: 50 }),
    description: text('description').default('')
})