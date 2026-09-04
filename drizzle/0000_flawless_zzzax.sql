CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permission_key" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"modul" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_permission_key_unique" UNIQUE("permission_key")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token" text NOT NULL,
	"device_info" text,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"expired_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_tokens_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(100) NOT NULL,
	"password" text NOT NULL,
	"name" varchar(100),
	"role_id" uuid NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"actor_email" varchar(100),
	"action" varchar(50) NOT NULL,
	"module" varchar(50) NOT NULL,
	"target_entity" varchar(50),
	"target_id" uuid,
	"ip_address" varchar(45),
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_program_id" uuid NOT NULL,
	"cohort_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"code" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "classes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "cohorts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cohorts_year_unique" UNIQUE("year")
);
--> statement-breakpoint
CREATE TABLE "faculties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "faculties_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "study_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faculty_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"degree" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "study_programs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nim" varchar(30) NOT NULL,
	"gender" varchar(10) NOT NULL,
	"phone_number" varchar(20),
	"study_program_id" uuid NOT NULL,
	"cohort_id" uuid NOT NULL,
	"class_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "students_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "students_nim_unique" UNIQUE("nim")
);
--> statement-breakpoint
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
CREATE TABLE "srq_cut_offs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cutoff_score" integer DEFAULT 6 NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_study_program_id_study_programs_id_fk" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_programs" ADD CONSTRAINT "study_programs_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_study_program_id_study_programs_id_fk" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triage_options" ADD CONSTRAINT "triage_options_question_id_triage_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."triage_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_schedules" ADD CONSTRAINT "screening_schedules_tester_id_users_id_fk" FOREIGN KEY ("tester_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_sessions" ADD CONSTRAINT "screening_sessions_schedule_id_screening_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."screening_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_sessions" ADD CONSTRAINT "screening_sessions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_screening_result_id_screening_results_id_fk" FOREIGN KEY ("screening_result_id") REFERENCES "public"."screening_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_handled_by_user_id_users_id_fk" FOREIGN KEY ("handled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_results" ADD CONSTRAINT "screening_results_session_id_screening_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."screening_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_results" ADD CONSTRAINT "screening_results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_results" ADD CONSTRAINT "screening_results_srq_cut_off_id_srq_cut_offs_id_fk" FOREIGN KEY ("srq_cut_off_id") REFERENCES "public"."srq_cut_offs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tokens_user_id" ON "user_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tokens_expired_revoked" ON "user_tokens" USING btree ("expired_at","is_revoked");--> statement-breakpoint
CREATE INDEX "idx_users_role_id" ON "users" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_users_is_active" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_audit_actor_user_id" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_module_action" ON "audit_logs" USING btree ("module","action");--> statement-breakpoint
CREATE INDEX "idx_audit_target" ON "audit_logs" USING btree ("target_entity","target_id");--> statement-breakpoint
CREATE INDEX "idx_audit_created_at" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_classes_study_program_id" ON "classes" USING btree ("study_program_id");--> statement-breakpoint
CREATE INDEX "idx_classes_cohort_id" ON "classes" USING btree ("cohort_id");--> statement-breakpoint
CREATE INDEX "idx_classes_sp_cohort" ON "classes" USING btree ("study_program_id","cohort_id");--> statement-breakpoint
CREATE INDEX "idx_classes_is_active" ON "classes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_cohorts_is_active" ON "cohorts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_faculties_is_active" ON "faculties" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_study_programs_faculty_id" ON "study_programs" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "idx_study_programs_is_active" ON "study_programs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_students_user_id" ON "students" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_students_study_program_id" ON "students" USING btree ("study_program_id");--> statement-breakpoint
CREATE INDEX "idx_students_cohort_id" ON "students" USING btree ("cohort_id");--> statement-breakpoint
CREATE INDEX "idx_students_class_id" ON "students" USING btree ("cohort_id");--> statement-breakpoint
CREATE INDEX "idx_students_sp_cohort_class" ON "students" USING btree ("study_program_id","cohort_id","class_id");--> statement-breakpoint
CREATE INDEX "idx_triage_options_question_id" ON "triage_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_triage_questions_category" ON "triage_questions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_triage_questions_is_active" ON "triage_questions" USING btree ("is_active");--> statement-breakpoint
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