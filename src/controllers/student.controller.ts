import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest, AuthReqWithParams } from "@/middleware/auth";
import { StudentService } from "@/services/student.service";
import {
  GetStudentQueryInput,
  RegisterStudentInput,
  UpdateStudentInput,
} from "@/types/student.types";
import { successResponse } from "@/utils/response";

export class StudentController {
  /**
   * REGISTRASI MAHASISWA (PUBLIK ATAU VIA ADMIN PANEL)
   */
  static async registerStudent(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const payload = req.body as RegisterStudentInput;

      // Jika request membawa data req.user (artinya lewat Admin Panel), catat Admin sebagai Actor
      const authReq = req as AuthenticatedRequest;
      const actor = authReq.user
        ? { userId: authReq.user.userId, email: authReq.user.email }
        : undefined;

      const result = await StudentService.registerStudent(
        payload,
        req.ip,
        actor,
      );

      return successResponse(
        res,
        result,
        "Student registered successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET ALL STUDENTS + PAGINATION, SEARCH & MULTI-FILTER (ADMIN)
   */
  static async getStudents(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const queryFilters = req.query as unknown as GetStudentQueryInput;
      const { students, pagination } =
        await StudentService.getStudents(queryFilters);

      return successResponse(
        res,
        students,
        "Student list retrieved successfully",
        200,
        pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET STUDENT BY ID
   */
  static async getStudentById(
    req: AuthReqWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const student = await StudentService.getStudentById(id);

      return successResponse(res, student, "Student retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPDATE STUDENT PROFILE (ADMIN)
   */
  static async updateStudent(
    req: AuthenticatedRequest<{ id: string }, any, UpdateStudentInput>,
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

      const student = await StudentService.updateStudent(
        id,
        payload,
        actor,
        req.ip,
      );

      return successResponse(res, student, "Student updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE STUDENT (ADMIN)
   */
  static async deleteStudent(
    req: AuthReqWithParams<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const actor = {
        userId: req.user?.userId as string,
        email: req.user?.email as string,
      };

      await StudentService.deleteStudent(id, actor, req.ip);

      return successResponse(res, null, "Student deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}
