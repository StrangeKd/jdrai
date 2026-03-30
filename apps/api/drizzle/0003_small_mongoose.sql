ALTER TABLE "adventures" ADD COLUMN "narrative_summary" text;--> statement-breakpoint
ALTER TABLE "adventures" ADD COLUMN "is_game_over" boolean DEFAULT false NOT NULL;