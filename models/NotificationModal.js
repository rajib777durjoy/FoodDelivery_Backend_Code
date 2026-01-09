import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";


const notification_table = pgTable('notification_table', {
    id: serial('id').primaryKey(),
    user_id: integer('user_id').notNull(),
    order_id: integer('order_id'),
    message: text('message').notNull(),
    read: boolean('read').default(false),
    created_at: timestamp('created_at').defaultNow()
})

export default notification_table;