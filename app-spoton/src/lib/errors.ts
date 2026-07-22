export class AppError extends Error {
  public code: string;
  public status?: number;
  public data?: any;

  constructor(message: string, code: string, status?: number, data?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN',
};

export function parseApiError(error: any): AppError {
  if (!error.response) {
    return new AppError('Mất kết nối mạng. Vui lòng kiểm tra lại.', ERROR_CODES.NETWORK_ERROR);
  }

  const { status, data } = error.response;
  const message = data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.';
  
  let code = ERROR_CODES.UNKNOWN;
  if (status === 401) code = ERROR_CODES.UNAUTHORIZED;
  else if (status === 403) code = ERROR_CODES.FORBIDDEN;
  else if (status === 404) code = ERROR_CODES.NOT_FOUND;
  else if (status === 400) code = ERROR_CODES.VALIDATION_ERROR;
  else if (status >= 500) code = ERROR_CODES.SERVER_ERROR;

  return new AppError(message, code, status, data);
}
