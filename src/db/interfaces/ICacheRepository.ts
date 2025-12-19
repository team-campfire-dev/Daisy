/**
 * Cache types supported
 */
export type CacheType = 'place' | 'route' | 'course';

/**
 * Cache data model
 */
export interface CacheData {
    id: string;
    sessionId: string;
    cacheType: CacheType;
    cacheKey: string;
    cacheData: string; // JSON stringified
    createdAt: Date;
    expiresAt: Date;
}

/**
 * Parsed cache data with generic type
 */
export interface ParsedCacheData<T> {
    id: string;
    sessionId: string;
    cacheType: CacheType;
    cacheKey: string;
    data: T; // Parsed JSON data
    createdAt: Date;
    expiresAt: Date;
}

/**
 * Repository interface for Cache operations
 */
export interface ICacheRepository {
    /**
     * Store data in cache
     * @param sessionId - Session ID
     * @param cacheType - Type of cache (place, route, course)
     * @param cacheKey - Unique key for this cache entry
     * @param data - Data to cache (will be JSON stringified)
     * @param ttlDays - Time to live in days (default: 7)
     */
    setCache(
        sessionId: string,
        cacheType: CacheType,
        cacheKey: string,
        data: unknown,
        ttlDays?: number
    ): Promise<void>;

    /**
     * Get cached data by session ID, type, and key
     */
    getCache(
        sessionId: string,
        cacheType: CacheType,
        cacheKey: string
    ): Promise<CacheData | null>;

    /**
     * Get all caches for a session, optionally filtered by type
     */
    getCachesBySession(
        sessionId: string,
        cacheType?: CacheType
    ): Promise<CacheData[]>;

    /**
     * Delete expired cache entries
     * @returns Number of cache entries deleted
     */
    clearExpiredCache(): Promise<number>;

    /**
     * Clear all cache for a specific session
     */
    clearSessionCache(sessionId: string): Promise<void>;

    /**
     * Delete a specific cache entry
     */
    deleteCache(id: string): Promise<void>;
}
