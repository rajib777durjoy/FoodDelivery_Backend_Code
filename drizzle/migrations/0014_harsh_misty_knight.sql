ALTER TABLE "order_table" ADD COLUMN "payment_tran_id" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "order_table" ADD COLUMN "payment_status" boolean DEFAULT false;