import { Injectable, Logger } from '@nestjs/common';
import * as NodeCache from 'node-cache';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache: NodeCache;

  constructor(ttl = 300) {
    this.cache = new NodeCache({ stdTTL: ttl, checkperiod: 60, useClones: true });
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    try {
      if (!key || typeof key !== 'string') {
        this.logger.warn(`Invalid cache key: ${key}`);
        return;
      }
      this.cache.set(key, value, ttlSeconds);
    } catch (error) {
      this.logger.error(`Failed to set cache for key ${key}: | error : ${error}`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = this.cache.get<T>(key);
      if (value === undefined) {
        this.logger.debug(`Cache miss: ${key}`);
        return null;
      }
      return value;
    } catch (error) {
      this.logger.error(`Failed to get cache for key ${key}: ${error}`);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      return this.cache.del(key) > 0;
    } catch (error) {
      this.logger.error(`Failed to delete cache for key ${key}: ${error}`);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.flushAll();
    } catch (error) {
      this.logger.error(`Failed to clear cache: ${error}`);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return this.cache.has(key);
    } catch (error) {
      this.logger.error(`Failed to check cache for key ${key}: ${error}`);
      return false;
    }
  }
}