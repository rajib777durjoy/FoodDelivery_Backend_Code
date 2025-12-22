ALTER TABLE "users_table" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "id" SET DEFAULT GENERATED ALWAYS AS IDENTITY;