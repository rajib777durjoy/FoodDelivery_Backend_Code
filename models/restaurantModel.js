import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users_table } from "./userModel.js";

export const restaurant_table = pgTable('restaurant_table', {
    id:serial('id').primaryKey(),
    user_id: integer("user_id")
    .references(() => users_table.id, { onUpdate: "cascade", onDelete: "cascade" }),
    restaurant_name:varchar('restaurant_name',{length:225}),
    email:varchar('email',{length:225}),
    phone:varchar('phone',{length:15}),
    logo:text('logo').default(''),
    cover:text('cover').default(''),
    description:text('description'),
    address:text('address'),
    active:boolean('active').default(true),
    created_at:timestamp('created_at').defaultNow()
});