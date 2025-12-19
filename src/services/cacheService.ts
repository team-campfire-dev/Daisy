import { DatabaseContainer } from '@/db/container';
import { CacheType, ParsedCacheData } from '@/db/interfaces/ICacheRepository';
import { Place } from './placeService';
import { CoursePlan } from './gemini';

/**
 * High-level caching service for user data
 */
export class CacheService {
    /**
     * Cache a place query and its results
     */
    static async cachePlaceQuery(
        sessionId: string,
        query: string,
        results: Place[]
    ): Promise<void> {
        const cacheRepo = DatabaseContainer.getCacheRepository();
        await cacheRepo.setCache(
            sessionId,
            'place',
            `query:${query}`,
            results
        );
    }

    /**
     * Get cached place query results
     */
    static async getCachedPlaceQuery(
        sessionId: string,
        query: string
    ): Promise<Place[] | null> {
        const cacheRepo = DatabaseContainer.getCacheRepository();
        const cache = await cacheRepo.getCache(sessionId, 'place', `query:${query}`);

        if (!cache) return null;

        try {
            return JSON.parse(cache.cacheData) as Place[];
        } catch (error) {
            console.error('[CacheService] Failed to parse cached place query:', error);
            return null;
        }
    }

    /**
     * Get all cached places for a session
     */
    static async getCachedPlaces(sessionId: string): Promise<Place[]> {
        const cacheRepo = DatabaseContainer.getCacheRepository();
        const caches = await cacheRepo.getCachesBySession(sessionId, 'place');

        const places: Place[] = [];
        for (const cache of caches) {
            try {
                const parsed = JSON.parse(cache.cacheData) as Place[];
                places.push(...parsed);
            } catch (error) {
                console.error('[CacheService] Failed to parse cached places:', error);
            }
        }

        return places;
    }

    /**
     * Cache a generated course
     */
    static async cacheCourse(
        sessionId: string,
        courseId: string,
        course: CoursePlan
    ): Promise<void> {
        const cacheRepo = DatabaseContainer.getCacheRepository();
        await cacheRepo.setCache(
            sessionId,
            'course',
            courseId,
            course
        );
    }

    /**
     * Get cached course
     */
    static async getCachedCourse(
        sessionId: string,
        courseId: string
    ): Promise<CoursePlan | null> {
        const cacheRepo = DatabaseContainer.getCacheRepository();
        const cache = await cacheRepo.getCache(sessionId, 'course', courseId);

        if (!cache) return null;

        try {
            return JSON.parse(cache.cacheData) as CoursePlan;
        } catch (error) {
            console.error('[CacheService] Failed to parse cached course:', error);
            return null;
        }
    }

    /**
     * Get all cached courses for a session
     */
    static async getCachedCourses(sessionId: string): Promise<CoursePlan[]> {
        const cacheRepo = DatabaseContainer.getCacheRepository();
        const caches = await cacheRepo.getCachesBySession(sessionId, 'course');

        const courses: CoursePlan[] = [];
        for (const cache of caches) {
            try {
                const parsed = JSON.parse(cache.cacheData) as CoursePlan;
                courses.push(parsed);
            } catch (error) {
                console.error('[CacheService] Failed to parse cached course:', error);
            }
        }

        return courses;
    }

    /**
     * Cache a route calculation
     */
    static async cacheRoute(
        sessionId: string,
        routeKey: string,
        route: unknown
    ): Promise<void> {
        const cacheRepo = DatabaseContainer.getCacheRepository();
        await cacheRepo.setCache(
            sessionId,
            'route',
            routeKey,
            route
        );
    }

    /**
     * Get cached route
     */
    static async getCachedRoute<T = unknown>(
        sessionId: string,
        routeKey: string
    ): Promise<T | null> {
        const cacheRepo = DatabaseContainer.getCacheRepository();
        const cache = await cacheRepo.getCache(sessionId, 'route', routeKey);

        if (!cache) return null;

        try {
            return JSON.parse(cache.cacheData) as T;
        } catch (error) {
            console.error('[CacheService] Failed to parse cached route:', error);
            return null;
        }
    }

    /**
     * Clear all cache for a session
     */
    static async clearSessionCache(sessionId: string): Promise<void> {
        const cacheRepo = DatabaseContainer.getCacheRepository();
        await cacheRepo.clearSessionCache(sessionId);
    }

    /**
     * Cleanup expired cache entries
     * Should be called periodically (e.g., via cron job)
     */
    static async cleanupExpiredCache(): Promise<number> {
        const cacheRepo = DatabaseContainer.getCacheRepository();
        return await cacheRepo.clearExpiredCache();
    }

    /**
     * Get cache statistics for a session
     */
    static async getCacheStats(sessionId: string): Promise<{
        places: number;
        courses: number;
        routes: number;
        total: number;
    }> {
        const cacheRepo = DatabaseContainer.getCacheRepository();

        const [places, courses, routes] = await Promise.all([
            cacheRepo.getCachesBySession(sessionId, 'place'),
            cacheRepo.getCachesBySession(sessionId, 'course'),
            cacheRepo.getCachesBySession(sessionId, 'route'),
        ]);

        return {
            places: places.length,
            courses: courses.length,
            routes: routes.length,
            total: places.length + courses.length + routes.length,
        };
    }
}
