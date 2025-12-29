CREATE TABLE "food_menu_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"res_id" integer,
	"category" varchar(100) NOT NULL,
	"food_name" varchar(150) NOT NULL,
	"price" numeric NOT NULL,
	"food_image" text NOT NULL,
	"available" boolean DEFAULT true,
	"active" boolean DEFAULT true,
	"description" text DEFAULT ''
);
--> statement-breakpoint
ALTER TABLE "food_menu_table" ADD CONSTRAINT "food_menu_table_res_id_restaurant_table_id_fk" FOREIGN KEY ("res_id") REFERENCES "public"."restaurant_table"("id") ON DELETE cascade ON UPDATE cascade;