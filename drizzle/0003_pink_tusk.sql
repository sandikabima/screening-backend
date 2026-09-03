CREATE TABLE "triage_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"option_label" varchar(255) NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"order_number" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "triage_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"category" varchar(20) NOT NULL,
	"question_text" text NOT NULL,
	"order_number" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "triage_questions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "triage_options" ADD CONSTRAINT "triage_options_question_id_triage_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."triage_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_triage_options_question_id" ON "triage_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_triage_questions_category" ON "triage_questions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_triage_questions_is_active" ON "triage_questions" USING btree ("is_active");