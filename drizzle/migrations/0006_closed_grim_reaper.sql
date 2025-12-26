CREATE TABLE "restaurant_table" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" integer,
	"restaurant_name" varchar(225),
	"email" varchar(225),
	"phone" varchar(15),
	"logo" text DEFAULT '',
	"cover" text DEFAULT '',
	"description" text,
	"address" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "restaurant_table" ADD CONSTRAINT "restaurant_table_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE cascade ON UPDATE cascade;