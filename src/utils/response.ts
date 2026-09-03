import { Response } from "express";

// API Response interface
export interface ApiResponse<T = any> {
  meta: {
    success: boolean;
    message: string;
    code: number;
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  data: T;
}

// Pagination interface
export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

// Success response helper
export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  code: number = 200,
  pagination?: PaginationParams,
): Response<ApiResponse<T>> => {
  const response: ApiResponse<T> = {
    meta: {
      success: true,
      message,
      code,
      timestamp: new Date().toISOString(),
    },
    data,
  };

  // Add pagination if provided
  if (pagination) {
    response.meta.pagination = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    };
  }
  return res.status(code).json(response);
};

// Error response helper
export const errorResponse = (
  res: Response,
  message: string,
  code: number = 500,
  data: any = null,
): Response<ApiResponse<null>> => {
  const response: ApiResponse<null> = {
    meta: {
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
    },
    data,
  };

  return res.status(code).json(response);
};

// Validation error response helper
export const validationErrorResponse = (
  res: Response,
  errors: any[],
  message: string = "Validation failed",
): Response<ApiResponse<null>> => {
  return errorResponse(res, message, 422, errors);
};

// Not found response helper
export const notFoundResponse = (
  res: Response,
  message: string = "Resource not found",
): Response<ApiResponse<null>> => {
  return errorResponse(res, message, 404);
};

// Unauthorized response helper
export const unauthorizedResponse = (
  res: Response,
  message: string = "Unauthorized",
): Response<ApiResponse<null>> => {
  return errorResponse(res, message, 401);
};

// Forbidden response helper
export const forbiddenResponse = (
  res: Response,
  message: string = "Forbidden",
): Response<ApiResponse<null>> => {
  return errorResponse(res, message, 403);
};

// Created response helper
export const createdResponse = <T>(
  res: Response,
  data: T,
  message: string = "Resource created successfully",
): Response<ApiResponse<T>> => {
  return successResponse(res, data, message, 201);
};

// Update response helper
export const updatedResponse = <T>(
  res: Response,
  data: T,
  message: string = "Resource updated successfully",
): Response<ApiResponse<T>> => {
  return successResponse(res, data, message, 200);
};

// Deleted response helper
export const deleteResponse = (
  res: Response,
  message: string = "Resource deleted successfully",
): Response<ApiResponse<null>> => {
  return successResponse(res, null, message, 200);
};
