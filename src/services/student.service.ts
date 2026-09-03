import { and, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  classes,
  cohorts,
  roles,
  studyPrograms,
  students,
  users,
} from "@/db/schema";
import { UserActor } from "@/services/user.service";
import { AuditLogService } from "@/services/auditLog.service";
import {
  GetStudentQueryInput,
  RegisterStudentInput,
  StudentResponse,
  UpdateStudentInput,
} from "@/types/student.types";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import { normalizePositiveNumber } from "@/utils/pagination";
import { PasswordUtils } from "@/utils/password";

export class StudentService {
  /**
   * REGISTRASI MAHASISWA (PUBLIK / VIA ADMIN PANEL - ATOMIC TRANSACTION)
   */
  static async registerStudent(
    input: RegisterStudentInput,
    ipAddress?: string,
    actor?: UserActor,
  ): Promise<StudentResponse> {
    // 1. Cek email tidak duplikat di tabel users
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existingUser) {
      throw new BadRequestError("Email is already registered");
    }

    // 2. Cek NIM tidak duplikat di tabel students
    const existingNim = await db.query.students.findFirst({
      where: eq(students.nim, input.nim),
    });

    if (existingNim) {
      throw new BadRequestError(`NIM ${input.nim} is already registered`);
    }

    // 3. Validasi Foreign Keys & Role Student
    const [spExists, cohortExists, studentRole] = await Promise.all([
      db.query.studyPrograms.findFirst({
        where: eq(studyPrograms.id, input.studyProgramId),
      }),
      db.query.cohorts.findFirst({
        where: eq(cohorts.id, input.cohortId),
      }),
      db.query.roles.findFirst({
        where: eq(roles.name, "STUDENT"),
      }),
    ]);

    if (!spExists) {
      throw new NotFoundError(
        `Study Program with ID ${input.studyProgramId} not found`,
      );
    }

    if (!cohortExists) {
      throw new NotFoundError(`Cohort with ID ${input.cohortId} not found`);
    }

    if (!studentRole) {
      throw new NotFoundError("Role STUDENT not found in system");
    }

    // 4. Hash password menggunakan PasswordUtils
    const hashedPassword = await PasswordUtils.hash(input.password);

    // 5. ATOMIC TRANSACTION (users & students)
    const createdStudentId = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          name: input.name,
          email: input.email,
          password: hashedPassword,
          roleId: studentRole.id,
          isActive: true,
        })
        .returning();

      const [newStudent] = await tx
        .insert(students)
        .values({
          userId: newUser.id,
          nim: input.nim,
          gender: input.gender,
          phoneNumber: input.phoneNumber,
          studyProgramId: input.studyProgramId,
          cohortId: input.cohortId,
          classId: input.classId || null,
        })
        .returning();

      return newStudent.id;
    });

    const result = await this.getStudentById(createdStudentId);

    // 6. Record Audit Log (Jika actor dipassing berarti diinput Admin, jika tidak berarti registrasi publik)
    await AuditLogService.record({
      actorUserId: actor?.userId || result.userId,
      actorEmail: actor?.email || result.user?.email || input.email,
      action: actor ? "STUDENT_CREATE_BY_ADMIN" : "STUDENT_REGISTER",
      module: "STUDENT_MANAGEMENT",
      targetEntity: "students",
      targetId: result.id,
      ipAddress,
      details: {
        nim: result.nim,
        studyProgramId: result.studyProgramId,
        cohortId: result.cohortId,
      },
    });

    return result;
  }

  /**
   * GET ALL STUDENTS + PAGINATION, SEARCH & FULL MULTI-FILTER (ADMIN)
   */
  static async getStudents(query: GetStudentQueryInput) {
    const page = normalizePositiveNumber(query.page, 1);
    const limit = normalizePositiveNumber(query.limit, 10);
    const search = query.search?.trim() || "";
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        sql`(
      students.nim ILIKE ${searchPattern} 
      OR EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = students.user_id 
        AND (users.name ILIKE ${searchPattern} OR users.email ILIKE ${searchPattern})
      )
    )`,
      );
    }

    // 2. Filter Gender ('L' / 'P')
    if (query.gender) {
      conditions.push(eq(students.gender, query.gender));
    }

    // 3. Filter Study Program
    if (query.studyProgramId) {
      conditions.push(eq(students.studyProgramId, query.studyProgramId));
    }

    // 4. Filter Cohort / Angkatan
    if (query.cohortId) {
      conditions.push(eq(students.cohortId, query.cohortId));
    }

    // 5. Filter Class / Rombel
    if (query.classId) {
      conditions.push(eq(students.classId, query.classId));
    }

    // 6. Filter Faculty (Relasi via study_programs)
    if (query.facultyId) {
      conditions.push(
        sql`students.study_program_id IN (
      SELECT id FROM study_programs WHERE faculty_id = ${query.facultyId}
    )`,
      );
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [studentsRaw, totalResult] = await Promise.all([
      db.query.students.findMany({
        where: whereClause,
        with: {
          user: true,
          studyProgram: {
            with: {
              faculty: true,
            },
          },
          cohort: true,
          class: true,
        },
        limit,
        offset,
        orderBy: (studentTable, { desc }) => [desc(studentTable.createdAt)],
      }),
      db
        .select({ count: sql<number>`count(${students.id})` })
        .from(students)
        .leftJoin(users, eq(students.userId, users.id))
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const formattedList = studentsRaw.map((s) => this.mapStudent(s));

    return {
      students: formattedList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * GET STUDENT BY ID
   */
  static async getStudentById(id: string): Promise<StudentResponse> {
    const student = await db.query.students.findFirst({
      where: eq(students.id, id),
      with: {
        user: true,
        studyProgram: {
          with: {
            faculty: true,
          },
        },
        cohort: true,
        class: true,
      },
    });

    if (!student) {
      throw new NotFoundError(`Student with ID ${id} not found`);
    }

    return this.mapStudent(student);
  }

  /**
   * UPDATE STUDENT PROFILE (ADMIN)
   */
  static async updateStudent(
    id: string,
    input: UpdateStudentInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<StudentResponse> {
    const existingStudent = await db.query.students.findFirst({
      where: eq(students.id, id),
    });

    if (!existingStudent) {
      throw new NotFoundError(`Student with ID ${id} not found`);
    }

    if (input.studyProgramId) {
      const spExists = await db.query.studyPrograms.findFirst({
        where: eq(studyPrograms.id, input.studyProgramId),
      });
      if (!spExists) {
        throw new NotFoundError(
          `Study Program with ID ${input.studyProgramId} not found`,
        );
      }
    }

    if (input.cohortId) {
      const cohortExists = await db.query.cohorts.findFirst({
        where: eq(cohorts.id, input.cohortId),
      });
      if (!cohortExists) {
        throw new NotFoundError(`Cohort with ID ${input.cohortId} not found`);
      }
    }

    if (input.classId) {
      const classExists = await db.query.classes.findFirst({
        where: eq(classes.id, input.classId),
      });
      if (!classExists) {
        throw new NotFoundError(`Class with ID ${input.classId} not found`);
      }
    }

    await db.transaction(async (tx) => {
      if (input.name) {
        await tx
          .update(users)
          .set({ name: input.name, updatedAt: new Date() })
          .where(eq(users.id, existingStudent.userId));
      }

      const { name, ...studentPayload } = input;

      if (Object.keys(studentPayload).length > 0) {
        await tx
          .update(students)
          .set({
            ...studentPayload,
            updatedAt: new Date(),
          })
          .where(eq(students.id, id));
      }
    });

    const result = await this.getStudentById(id);

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "STUDENT_UPDATE",
      module: "STUDENT_MANAGEMENT",
      targetEntity: "students",
      targetId: id,
      ipAddress,
      details: {
        updatedFields: input,
      },
    });

    return result;
  }

  /**
   * DELETE STUDENT + USER CREDENTIALS (ADMIN)
   */
  static async deleteStudent(
    id: string,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<void> {
    const existingStudent = await db.query.students.findFirst({
      where: eq(students.id, id),
    });

    if (!existingStudent) {
      throw new NotFoundError(`Student with ID ${id} not found`);
    }

    await db.transaction(async (tx) => {
      await tx.delete(students).where(eq(students.id, id));
      await tx.delete(users).where(eq(users.id, existingStudent.userId));
    });

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "STUDENT_DELETE",
      module: "STUDENT_MANAGEMENT",
      targetEntity: "students",
      targetId: id,
      ipAddress,
      details: {
        deletedNIM: existingStudent.nim,
      },
    });
  }

  private static mapStudent(s: any): StudentResponse {
    return {
      id: s.id,
      userId: s.userId,
      nim: s.nim,
      gender: s.gender,
      phoneNumber: s.phoneNumber,
      studyProgramId: s.studyProgramId,
      cohortId: s.cohortId,
      classId: s.classId || null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      user: s.user
        ? {
            id: s.user.id,
            name: s.user.name,
            email: s.user.email,
            avatarUrl: s.user.avatarUrl || null,
            isActive: s.user.isActive,
          }
        : undefined,
      studyProgram: s.studyProgram
        ? {
            id: s.studyProgram.id,
            facultyId: s.studyProgram.facultyId,
            code: s.studyProgram.code,
            name: s.studyProgram.name,
            degree: s.studyProgram.degree,
            faculty: s.studyProgram.faculty
              ? {
                  id: s.studyProgram.faculty.id,
                  code: s.studyProgram.faculty.code,
                  name: s.studyProgram.faculty.name,
                }
              : undefined,
          }
        : undefined,
      cohort: s.cohort
        ? {
            id: s.cohort.id,
            year: s.cohort.year,
            name: s.cohort.name,
          }
        : undefined,
      class: s.class
        ? {
            id: s.class.id,
            code: s.class.code,
            name: s.class.name,
          }
        : null,
    };
  }
}
