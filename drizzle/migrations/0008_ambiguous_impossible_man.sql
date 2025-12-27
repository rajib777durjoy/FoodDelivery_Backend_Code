CREATE TABLE "delivery_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(225),
	"email" varchar(225),
	"location" text,
	"address" text,
	"active" boolean DEFAULT true,
	"ride" varchar(50),
	"description" text DEFAULT ''
);
--> statement-breakpoint
ALTER TABLE "delivery_table" ADD CONSTRAINT "delivery_table_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE cascade ON UPDATE cascade;