import { NextFunction, Response } from "express";
import { AuthenticatedRequest, AuthReqWithParams } from "@/middleware/auth";
import { QuestionService } from "../services/question.service";
import {
  GetQuestionsQueryInput,
  ToggleQuestionStatusInput,
  UpdateQuestionInput,
} from "../types/question.types";
import { successResponse } from "@/utils/response";

export class QuestionController {
  /**
   * GET ALL QUESTIONS (SUPPORT CATEGORY, CODE & SEARCH QUERY)
   */
  static async getQuestions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const queryFilters = req.query as unknown as GetQuestionsQueryInput;
      const questions = await QuestionService.getQuestions(queryFilters);

      return successResponse(
        res,
        questions,
        "Questions retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET QUESTION BY ID
   */
  static async getQuestionById(
    req: AuthReqWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const question = await QuestionService.getQuestionById(id);

      return successResponse(res, question, "Question retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPDATE QUESTION TEXT (ADMIN)
   */
  static async updateQuestionText(
    req: AuthenticatedRequest<{ id: string }, any, UpdateQuestionInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const actor = {
        userId: req.user?.userId as string,
        email: req.user?.email as string,
      };

      const question = await QuestionService.updateQuestionText(
        id,
        payload,
        actor,
        req.ip,
      );

      return successResponse(
        res,
        question,
        "Question text updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * TOGGLE QUESTION STATUS (IS_ACTIVE)
   */
  static async toggleQuestionStatus(
    req: AuthenticatedRequest<{ id: string }, any, ToggleQuestionStatusInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const actor = {
        userId: req.user?.userId as string,
        email: req.user?.email as string,
      };

      const question = await QuestionService.toggleQuestionStatus(
        id,
        payload,
        actor,
        req.ip,
      );

      return successResponse(
        res,
        question,
        `Question status updated to ${payload.isActive ? "active" : "inactive"} successfully`,
      );
    } catch (error) {
      next(error);
    }
  }
}
