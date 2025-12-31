CREATE TABLE "AddToCart_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"food_id" integer,
	"res_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "AddToCart_table" ADD CONSTRAINT "AddToCart_table_food_id_food_menu_table_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."food_menu_table"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "AddToCart_table" ADD CONSTRAINT "AddToCart_table_res_id_restaurant_table_id_fk" FOREIGN KEY ("res_id") REFERENCES "public"."restaurant_table"("id") ON DELETE cascade ON UPDATE cascade;