/**
 * lib/errors.ts
 * Chuẩn hóa xử lý lỗi toàn FE
 * KHÔNG sửa file này. Dùng AppError để throw lỗi có kiểm soát.
 */

export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export interface ApiErrorResponse {
  message: string;
  code?: string;
  errors?: Record<string, string>;
}

/**
 * Custom Error class dùng trong toàn bộ FE
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode?: number;
  public readonly fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    code: ErrorCode = 'UNKNOWN_ERROR',
    statusCode?: number,
    fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Parse lỗi từ API response thành AppError có cấu trúc
 */
export async function parseApiError(response: Response): Promise<AppError> {
  let body: ApiErrorResponse = { message: 'Lỗi không xác định' };

  try {
    body = await response.json();
  } catch {
    // Response không phải JSON
  }

  const message = body.message || 'Lỗi không xác định';

  switch (response.status) {
    case 400:
      return new AppError(message, 'VALIDATION_ERROR', 400, body.errors);
    case 401:
      return new AppError(message, 'UNAUTHORIZED', 401);
    case 403:
      return new AppError(message, 'FORBIDDEN', 403);
    case 404:
      return new AppError(message, 'NOT_FOUND', 404);
    default:
      return new AppError(message, 'SERVER_ERROR', response.status);
  }
}

/**
 * Xử lý lỗi fetch (network, timeout...)
 */
export function handleFetchError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError('Không thể kết nối đến máy chủ', 'NETWORK_ERROR');
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR');
  }

  return new AppError('Lỗi không xác định', 'UNKNOWN_ERROR');
}
