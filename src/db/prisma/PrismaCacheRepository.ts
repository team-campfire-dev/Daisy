import prisma from '@/lib/db';
import { ICacheRepository, CacheData, CacheType } from '../interfaces/ICacheRepository';
import { logger } from '@/lib/logger';

/**
 * Prisma implementation of ICacheRepository
 */
export class PrismaCacheRepository implements ICacheRepository {
    async setCache(
        sessionId: string,
        cacheType: CacheType,
        cacheKey: string,
        data: unknown,
        ttlDays: number = 7
    ): Promise<void> {
        try {
            const cacheData = JSON.stringify(data);
            const now = new Date();
            const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

            // Upsert based on sessionId + cacheType + cacheKey
            // Since we don't have a unique constraint, we'll check and update or create
            const existing = await prisma.userCache.findFirst({
                where: {
                    sessionId,
                    cacheType,
                    cacheKey,
                },
            });

            if (existing) {
                await prisma.userCache.update({
                    where: { id: existing.id },
                    data: {
                        cacheData,
                        expiresAt,
                        createdAt: now, // Update creation time too
                    },
                });
            } else {
                await prisma.userCache.create({
                    data: {
                        sessionId,
                        cacheType,
                        cacheKey,
                        cacheData,
                        expiresAt,
                    },
                });
            }

            logger.info(`Set cache: ${cacheType}/${cacheKey} for session ${sessionId}`, { service: 'CacheRepo' });
        } catch (error) {
            logger.error('Failed to set cache', { error, service: 'CacheRepo' });
            throw error;
        }
    }

    async getCache(
        sessionId: string,
        cacheType: CacheType,
        cacheKey: string
    ): Promise<CacheData | null> {
        try {
            const cache = await prisma.userCache.findFirst({
                where: {
                    sessionId,
                    cacheType,
                    cacheKey,
                },
            });

            if (!cache) {
                return null;
            }

            // Check if expired
            if (new Date(cache.expiresAt) < new Date()) {
                logger.info(`Cache expired: ${cacheType}/${cacheKey}, deleting...`, { service: 'CacheRepo' });
                await this.deleteCache(cache.id);
                return null;
            }

            return cache as unknown as CacheData;
        } catch (error) {
            logger.error('Failed to get cache', { error, service: 'CacheRepo' });
            return null;
        }
    }

    async getCachesBySession(
        sessionId: string,
        cacheType?: CacheType
    ): Promise<CacheData[]> {
        try {
            const where: { sessionId: string; cacheType?: CacheType } = { sessionId };
            if (cacheType) {
                where.cacheType = cacheType;
            }

            const caches = await prisma.userCache.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
            });

            // Filter out expired caches
            const now = new Date();
            const validCaches = caches.filter((cache) => new Date(cache.expiresAt) >= now);

            // Delete expired ones in the background
            const expiredIds = caches
                .filter((cache) => new Date(cache.expiresAt) < now)
                .map((cache) => cache.id);

            if (expiredIds.length > 0) {
                prisma.userCache
                    .deleteMany({
                        where: {
                            id: { in: expiredIds },
                        },
                    })
                    .catch((err) => logger.error('Failed to delete expired caches', { error: err, service: 'CacheRepo' }));
            }

            return validCaches as unknown as CacheData[];
        } catch (error) {
            logger.error('Failed to get caches by session', { error, service: 'CacheRepo' });
            return [];
        }
    }

    async clearExpiredCache(): Promise<number> {
        try {
            const result = await prisma.userCache.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
            });

            logger.info(`Deleted ${result.count} expired cache entries`, { service: 'CacheRepo' });
            return result.count;
        } catch (error) {
            logger.error('Failed to clear expired cache', { error, service: 'CacheRepo' });
            return 0;
        }
    }

    async clearSessionCache(sessionId: string): Promise<void> {
        try {
            const result = await prisma.userCache.deleteMany({
                where: { sessionId },
            });
            logger.info(`Cleared ${result.count} cache entries for session ${sessionId}`, { service: 'CacheRepo' });
        } catch (error) {
            logger.error('Failed to clear session cache', { error, service: 'CacheRepo' });
            throw error;
        }
    }

    async deleteCache(id: string): Promise<void> {
        try {
            await prisma.userCache.delete({
                where: { id },
            });
        } catch (error) {
            logger.error('Failed to delete cache', { error, service: 'CacheRepo' });
            throw error;
        }
    }
}

// Export singleton instance
export const prismaCacheRepository = new PrismaCacheRepository();
