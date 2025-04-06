import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const now = Date.now();

    const user = req.user?.id || 'anonymous'; 

    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '[PROTECTED]';

    this.logger.log(
      `Incoming Request log | User: ${user} | ${method} ${url} | Body: ${JSON.stringify(safeBody)}`,
    );

    return next.handle().pipe(
      tap({
        next: responseData => {
          this.logger.log(`Outgoing Response | ${method} ${url} | Duration: ${Date.now() - now}ms`);
        },
        error: err => {
          this.logger.error(
            `Error | ${method} ${url} | Duration: ${Date.now() - now}ms | Message: ${err.message}`,
          );
        },
      }),
    );
  }
}
