CREATE TABLE "users_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"fullname" varchar(255),
	"email" varchar(255),
	"profile" text DEFAULT '',
	"role" text DEFAULT 'customer'
);
