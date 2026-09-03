CREATE TABLE "screening_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"tanggal" date NOT NULL,
	"jam_mulai" time NOT NULL,
	"jam_selesai" time NOT NULL,
	"tester_id" uuid NOT NULL,
	"barcode_value" varchar(100) NOT NULL,
	"status_barcode" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "screening_schedules_barcode_value_unique" UNIQUE("barcode_value")
);
--> statement-breakpoint
CREATE TABLE "screening_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'In_Progress' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "screening_sessions_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "follow_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"screening_result_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'Belum' NOT NULL,
	"notes" text,
	"handled_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screening_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"srq_cut_off_id" uuid,
	"raw_responses" jsonb NOT NULL,
	"srq_score" integer NOT NULL,
	"srq_cut_off_used" integer DEFAULT 6 NOT NULL,
	"is_srq_above_cut_off" boolean NOT NULL,
	"has_high_indicator" boolean NOT NULL,
	"safety_flag" boolean NOT NULL,
	"priority_result" varchar(10) NOT NULL,
	"reason_code" varchar(10) NOT NULL,
	"rule_version" varchar(20) DEFAULT 'TRIAGE-V1.0' NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "screening_results_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "screening_schedules" ADD CONSTRAINT "screening_schedules_tester_id_users_id_fk" FOREIGN KEY ("tester_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_sessions" ADD CONSTRAINT "screening_sessions_schedule_id_screening_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."screening_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_sessions" ADD CONSTRAINT "screening_sessions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_screening_result_id_screening_results_id_fk" FOREIGN KEY ("screening_result_id") REFERENCES "public"."screening_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_handled_by_user_id_users_id_fk" FOREIGN KEY ("handled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_results" ADD CONSTRAINT "screening_results_session_id_screening_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."screening_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_results" ADD CONSTRAINT "screening_results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_results" ADD CONSTRAINT "screening_results_srq_cut_off_id_srq_cut_offs_id_fk" FOREIGN KEY ("srq_cut_off_id") REFERENCES "public"."srq_cut_offs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_schedules_tester_id" ON "screening_schedules" USING btree ("tester_id");--> statement-breakpoint
CREATE INDEX "idx_schedules_barcode_value" ON "screening_schedules" USING btree ("barcode_value");--> statement-breakpoint
CREATE INDEX "idx_schedules_status_barcode" ON "screening_schedules" USING btree ("status_barcode");--> statement-breakpoint
CREATE INDEX "idx_sessions_schedule_id" ON "screening_sessions" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_student_id" ON "screening_sessions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_status" ON "screening_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_follow_ups_screening_result_id" ON "follow_ups" USING btree ("screening_result_id");--> statement-breakpoint
CREATE INDEX "idx_follow_ups_handled_by_user_id" ON "follow_ups" USING btree ("handled_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_follow_ups_status" ON "follow_ups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_results_session_id" ON "screening_results" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_results_student_id" ON "screening_results" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_results_priority_result" ON "screening_results" USING btree ("priority_result");--> statement-breakpoint
CREATE INDEX "idx_results_calculated_at" ON "screening_results" USING btree ("calculated_at");