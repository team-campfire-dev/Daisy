import { NextRequest, NextResponse } from 'next/server';
import { withSession } from '@/middleware/session';
import { CacheService } from '@/services/cacheService';
import { CacheType } from '@/db/interfaces/ICacheRepository';

/**
 * GET /api/cache?type={place|course|route}
 * Get cached items for the current session
 */
export const GET = withSession(async (request, session) => {
    const url = new URL(request.url);
    const cacheType = url.searchParams.get('type') as CacheType | null;

    if (cacheType && !['place', 'course', 'route'].includes(cacheType)) {
        return NextResponse.json(
            { error: 'Invalid cache type. Must be: place, course, or route' },
            { status: 400 }
        );
    }

    try {
        if (cacheType === 'place') {
            const places = await CacheService.getCachedPlaces(session.sessionId);
            return NextResponse.json({ type: 'place', data: places });
        } else if (cacheType === 'course') {
            const courses = await CacheService.getCachedCourses(session.sessionId);
            return NextResponse.json({ type: 'course', data: courses });
        } else {
            // Get stats if no specific type requested
            const stats = await CacheService.getCacheStats(session.sessionId);
            return NextResponse.json({ stats });
        }
    } catch (error) {
        console.error('[API] Failed to get cache:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve cache' },
            { status: 500 }
        );
    }
});

/**
 * DELETE /api/cache
 * Clear all cache for the current session
 */
export const DELETE = withSession(async (request, session) => {
    try {
        await CacheService.clearSessionCache(session.sessionId);
        return NextResponse.json({
            message: 'Cache cleared successfully',
        });
    } catch (error) {
        console.error('[API] Failed to clear cache:', error);
        return NextResponse.json(
            { error: 'Failed to clear cache' },
            { status: 500 }
        );
    }
});
