import { RATE_LIMIT_KEY, RateLimitOptions } from '@common/decorators/rate-limit.decorator';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import * as crypto from 'crypto';

const requestRecords: Record<string, { count: number; timestamp: number }[]> = {};

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    ) || { limit: 100, windowMs: 60000 };

    const ip = request.ip;
    const hashedIp = crypto.createHash('sha256').update(ip).digest('hex');
    return this.handleRateLimit(hashedIp, rateLimitOptions);
  }

  private handleRateLimit(ip: string, options: RateLimitOptions): boolean {
    const now = Date.now();
    const windowStart = now - options.windowMs;

    if (!requestRecords[ip]) {
      requestRecords[ip] = [];
    }

    requestRecords[ip] = requestRecords[ip].filter(record => record.timestamp > windowStart);

    if (requestRecords[ip].length >= options.limit) {
      throw new HttpException(
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Rate limit exceeded',
          message: 'You have exceeded the rate limit.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    requestRecords[ip].push({ count: 1, timestamp: now });
    return true;
  }
}

export const RateLimit = (limit: number, windowMs: number) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowMs });
