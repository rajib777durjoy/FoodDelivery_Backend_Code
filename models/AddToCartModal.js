import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { food_menu_table, restaurant_table } from "./restaurantModel.js";

const AddToCart_table = pgTable('AddToCart_table',{
    id:serial('id').primaryKey(),
    food_id:integer('food_id').references(() =>food_menu_table.id, { onUpdate: "cascade", onDelete: "cascade" }),
    res_id:integer('res_id').references(() =>restaurant_table.id, { onUpdate: "cascade", onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
})

export default AddToCart_table;