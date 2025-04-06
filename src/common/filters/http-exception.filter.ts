import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const responseData =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as Record<string, any>); // sometime return a string in my last project I can face this error so I can handle this 😉

    this.logger.error(
      `[${request.method}] ${request.url} → ${responseData.message || exception.message}`,
      exception.stack,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message: responseData.message || exception.message || 'An unexpected error occurred',
      error: responseData.error || null,
      data: null,
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] || null,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV !== 'production' && { stack: exception.stack }),
    });
  }
}
