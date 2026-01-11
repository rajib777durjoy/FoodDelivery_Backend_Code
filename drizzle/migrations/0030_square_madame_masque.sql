ALTER TABLE "order_table" RENAME COLUMN "user_id" TO "owner_id";--> statement-breakpoint
ALTER TABLE "order_table" DROP CONSTRAINT "order_table_user_id_users_table_id_fk";
--> statement-breakpoint
ALTER TABLE "delivery_table" ALTER COLUMN "status" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "order_table" ADD COLUMN "cus_id" integer;--> statement-breakpoint
ALTER TABLE "order_table" ADD CONSTRAINT "order_table_owner_id_users_table_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users_table"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_table" ADD CONSTRAINT "order_table_cus_id_users_table_id_fk" FOREIGN KEY ("cus_id") REFERENCES "public"."users_table"("id") ON DELETE cascade ON UPDATE cascade;