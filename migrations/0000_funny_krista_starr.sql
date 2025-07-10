CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" integer,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"message_count" integer DEFAULT 0,
	"duration" integer DEFAULT 0,
	"status" text DEFAULT 'active' NOT NULL,
	CONSTRAINT "conversations_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"keywords" text[],
	"priority" integer DEFAULT 1,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"voice_data" jsonb,
	"response_time" integer,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
