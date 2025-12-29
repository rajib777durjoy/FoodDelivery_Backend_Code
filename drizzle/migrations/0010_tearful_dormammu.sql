CREATE TABLE "order_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"food_id" integer,
	"delivery_id" integer,
	"delivery_location" text,
	"delivery_time" timestamp with time zone,
	"status" varchar(50) DEFAULT 'panding',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "food_menu_table" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "order_table" ADD CONSTRAINT "order_table_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_table" ADD CONSTRAINT "order_table_food_id_food_menu_table_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."food_menu_table"("id") ON DELETE cascade ON UPDATE cascade;