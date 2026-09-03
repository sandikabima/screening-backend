CREATE INDEX "idx_tokens_expired_revoked" ON "user_tokens" USING btree ("expired_at","is_revoked");--> statement-breakpoint
CREATE INDEX "idx_users_is_active" ON "users" USING btree ("is_active");--> statement-breakpoint
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
CREATE INDEX "idx_students_sp_cohort_class" ON "students" USING btree ("study_program_id","cohort_id","class_id");