import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: CacheService,
      useFactory: (configService: ConfigService) => {
        const ttl = configService.get<number>('CACHE_TTL') || 300;
        return new CacheService(ttl);
      },
      inject: [ConfigService],
    },
  ],
  exports: [CacheService],
})
export class CustomCacheModule {}
