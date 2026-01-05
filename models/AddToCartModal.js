import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { food_menu_table, restaurant_table } from "./restaurantModel.js";
import { users_table } from "./userModel.js";

const AddToCart_table = pgTable('AddToCart_table',{
    id:serial('id').primaryKey(),
    quantity:integer('quantity').default(1),
    food_id:integer('food_id').references(() =>food_menu_table.id, { onUpdate: "cascade", onDelete: "cascade" }),
    res_id:integer('res_id').references(() =>restaurant_table.id, { onUpdate: "cascade", onDelete: "cascade" }),
    user_id:integer('user_id').references(() =>users_table.id, { onUpdate: "cascade", onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
})

export default AddToCart_table;