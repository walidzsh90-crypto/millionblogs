import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from './domain-error';

interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  errors?: Array<{ field: string; constraints: string[] }>;
  requestId?: string;
  timestamp: string;
  path: string;
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id'] as string | undefined;

    const errorResponse = this.buildErrorResponse(exception, request, requestId);

    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        {
          err: exception,
          requestId,
          path: request.path,
          method: request.method,
        },
        errorResponse.message,
      );
    } else if (errorResponse.statusCode >= 400) {
      this.logger.warn({
        err: exception,
        requestId,
        path: request.path,
        method: request.method,
      });
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request,
    requestId?: string,
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.path;

    if (exception instanceof DomainError) {
      return {
        statusCode: exception.statusCode,
        code: exception.code,
        message: exception.message,
        errors:
          'errors' in exception
            ? (exception as any).errors
            : undefined,
        requestId,
        timestamp,
        path,
      };
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : (response as any).message ?? exception.message;

      return {
        statusCode: exception.getStatus(),
        code: 'HTTP_ERROR',
        message: Array.isArray(message) ? message.join('; ') : message,
        errors: Array.isArray(message)
          ? message.map((m: string) => ({ field: 'general', constraints: [m] }))
          : undefined,
        requestId,
        timestamp,
        path,
      };
    }

    const isProduction = process.env.NODE_ENV === 'production';

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'An unexpected error occurred' : (exception as Error).message,
      requestId,
      timestamp,
      path,
    };
  }
}
