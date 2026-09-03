import { and, asc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { triageOptions, triageQuestions } from "@/db/schema/assessment";
import { UserActor } from "@/services/user.service";
import { AuditLogService } from "@/services/auditLog.service";
import {
  GetQuestionsQueryInput,
  QuestionResponse,
  ToggleQuestionStatusInput,
  UpdateQuestionInput,
} from "../types/question.types";
import { NotFoundError } from "@/utils/errors";

export class QuestionService {
  /**
   * GET ALL QUESTIONS (SUPPORT CATEGORY, CODE & SEARCH QUERY)
   */
  static async getQuestions(
    query?: GetQuestionsQueryInput,
  ): Promise<QuestionResponse[]> {
    const conditions = [];

    // 1. Filter Kategori ('SRQ' | 'INTI')
    if (query?.category) {
      conditions.push(eq(triageQuestions.category, query.category));
    }

    // 2. Filter Spesifik Kode Soal (Misal 'SRQ-01', 'INTI-F1')
    if (query?.code?.trim()) {
      conditions.push(ilike(triageQuestions.code, `%${query.code.trim()}%`));
    }

    // 3. Global Search Bar (Match ke questionText ATAU code)
    if (query?.search?.trim()) {
      const searchPattern = `%${query.search.trim()}%`;
      conditions.push(
        sql`(${triageQuestions.questionText} ILIKE ${searchPattern} OR ${triageQuestions.code} ILIKE ${searchPattern})`,
      );
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const questionsRaw = await db.query.triageQuestions.findMany({
      where: whereClause,
      with: {
        options: {
          orderBy: [asc(triageOptions.orderNumber)],
        },
      },
      orderBy: [asc(triageQuestions.orderNumber)],
    });

    return questionsRaw.map((q) => this.mapQuestion(q));
  }

  /**
   * GET QUESTION BY ID
   */
  static async getQuestionById(id: string): Promise<QuestionResponse> {
    const question = await db.query.triageQuestions.findFirst({
      where: eq(triageQuestions.id, id),
      with: {
        options: {
          orderBy: [asc(triageOptions.orderNumber)],
        },
      },
    });

    if (!question) {
      throw new NotFoundError(`Question with ID ${id} not found`);
    }

    return this.mapQuestion(question);
  }

  /**
   * UPDATE QUESTION TEXT (ADMIN)
   */
  static async updateQuestionText(
    id: string,
    input: UpdateQuestionInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<QuestionResponse> {
    const existingQuestion = await db.query.triageQuestions.findFirst({
      where: eq(triageQuestions.id, id),
    });

    if (!existingQuestion) {
      throw new NotFoundError(`Question with ID ${id} not found`);
    }

    await db
      .update(triageQuestions)
      .set({
        questionText: input.questionText,
        updatedAt: new Date(),
      })
      .where(eq(triageQuestions.id, id));

    const result = await this.getQuestionById(id);

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "QUESTION_UPDATE_TEXT",
      module: "ASSESSMENT_MANAGEMENT",
      targetEntity: "triage_questions",
      targetId: id,
      ipAddress,
      details: {
        code: existingQuestion.code,
        previousText: existingQuestion.questionText,
        newText: input.questionText,
      },
    });

    return result;
  }

  /**
   * TOGGLE QUESTION ACTIVE STATUS (ADMIN - NO HARD DELETE)
   */
  static async toggleQuestionStatus(
    id: string,
    input: ToggleQuestionStatusInput,
    actor?: UserActor,
    ipAddress?: string,
  ): Promise<QuestionResponse> {
    const existingQuestion = await db.query.triageQuestions.findFirst({
      where: eq(triageQuestions.id, id),
    });

    if (!existingQuestion) {
      throw new NotFoundError(`Question with ID ${id} not found`);
    }

    await db
      .update(triageQuestions)
      .set({
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(triageQuestions.id, id));

    const result = await this.getQuestionById(id);

    await AuditLogService.record({
      actorUserId: actor?.userId,
      actorEmail: actor?.email,
      action: "QUESTION_TOGGLE_STATUS",
      module: "ASSESSMENT_MANAGEMENT",
      targetEntity: "triage_questions",
      targetId: id,
      ipAddress,
      details: {
        code: existingQuestion.code,
        previousIsActive: existingQuestion.isActive,
        newIsActive: input.isActive,
      },
    });

    return result;
  }

  /**
   * PRIVATE MAPPER METHOD
   */
  private static mapQuestion(q: any): QuestionResponse {
    return {
      id: q.id,
      code: q.code,
      category: q.category,
      questionText: q.questionText,
      orderNumber: q.orderNumber,
      isActive: q.isActive,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      options: q.options
        ? q.options.map((opt: any) => ({
            id: opt.id,
            questionId: opt.questionId,
            optionLabel: opt.optionLabel,
            score: opt.score,
            orderNumber: opt.orderNumber,
          }))
        : [],
    };
  }
}
