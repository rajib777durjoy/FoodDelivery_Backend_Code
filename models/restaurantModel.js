import { boolean, integer, numeric, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users_table } from "./userModel.js";


export const restaurant_table = pgTable('restaurant_table', {
    id: serial('id').primaryKey(),
    user_id: integer("user_id")
        .references(() => users_table.id, { onUpdate: "cascade", onDelete: "cascade" }),
    restaurant_name: varchar('restaurant_name', { length: 225 }),
    email: varchar('email', { length: 225 }),
    phone: varchar('phone', { length: 15 }),
    logo: text('logo').default(''),
    cover: text('cover').default(''),
    description: text('description'),
    address: text('address'),
    active: boolean('active').default(true),
    created_at: timestamp('created_at').defaultNow()
});

export const food_menu_table = pgTable('food_menu_table', {
    id: serial('id').primaryKey(),
    res_id: integer('res_id').references(() => restaurant_table.id, { onUpdate: "cascade", onDelete: "cascade" }),
    category: varchar('category', { length: 100 }).notNull(),
    food_name: varchar('food_name', { length: 150 }).notNull(),
    price: numeric('price').notNull(),
    food_image: text('food_image').notNull(),
    available: boolean('available').default(true),
    active: boolean('active').default(true),
    description: text('description').default(""),
    created_at: timestamp('created_at').defaultNow()
})

// When change order_table status column then set deliveryTime //
// user_id for customer user_table.id and  customer will defiend delivery location //
export const order_table = pgTable('order_table', {
    id: serial('id').primaryKey(),
    owner_id: integer("owner_id")
        .references(() => users_table.id, { onUpdate: "cascade", onDelete: "cascade" }),
    cus_id: integer("cus_id")
        .references(() => users_table.id, { onUpdate: "cascade", onDelete: "cascade" }),
    food_id: integer("food_id").references(() => food_menu_table.id, { onUpdate: "cascade", onDelete: "cascade" }),
    delivery_id: integer('delivery_id').default(null),
    delivery_location: text('delivery_location').default(" "),
    payment: numeric('payment', { precision: 10, scale: 2, }).notNull(),
    dueAmount: numeric('dueAmount', { precision: 10, scale: 2, }),
    customer_phone: text('customer_phone'),
    quantity: integer('quantity').default(1),
    payment_method: text('payment_method').default(''),
    payment_tran_id: text('payment_tran_id').default(''),
    payment_status: boolean('payment_status').default(false),
    deliveryTime: timestamp("delivery_time", {
        withTimezone: true,
    }),
    status: varchar('status', { length: 50 }).default('panding'),
    OTP: integer('OTP').default(null),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
})