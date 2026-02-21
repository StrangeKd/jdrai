CREATE TYPE "public"."difficulty" AS ENUM('easy', 'normal', 'hard', 'nightmare');--> statement-breakpoint
CREATE TYPE "public"."estimated_duration" AS ENUM('short', 'medium', 'long');--> statement-breakpoint
CREATE TABLE "adventure_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"difficulty" "difficulty" DEFAULT 'normal' NOT NULL,
	"estimated_duration" "estimated_duration" DEFAULT 'medium' NOT NULL,
	"system_prompt" text NOT NULL,
	"seed_data" jsonb,
	"is_public" boolean DEFAULT true NOT NULL,
	CONSTRAINT "adventure_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "character_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"base_stats" jsonb,
	"is_default" boolean DEFAULT false NOT NULL,
	CONSTRAINT "character_classes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "races" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"traits" jsonb,
	"is_default" boolean DEFAULT false NOT NULL,
	CONSTRAINT "races_name_unique" UNIQUE("name")
);
