CREATE TABLE "meta_characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"background" text,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"cosmetics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"race_id" uuid,
	"class_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meta_characters_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "adventure_templates" ADD COLUMN "is_tutorial" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "adventures" ADD COLUMN "is_tutorial" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "meta_characters" ADD CONSTRAINT "meta_characters_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_characters" ADD CONSTRAINT "meta_characters_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_characters" ADD CONSTRAINT "meta_characters_class_id_character_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."character_classes"("id") ON DELETE no action ON UPDATE no action;