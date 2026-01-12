import prisma from '@/lib/db';
import { getWalkingRoute, RouteInfo } from '@/lib/tmap';
import { logger } from '@/lib/logger';

/**
 * Get walking route, checking cache first.
 * If cache miss, calls TMap API and saves result.
 */
export async function getOrFetchWalkingRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
): Promise<RouteInfo | null> {

    // 1. Rounding or Fuzzy Matching might be needed in real-world,
    // but for now we assume exact coordinates from our DB/State.
    const startLat = origin.lat;
    const startLng = origin.lng;
    const endLat = destination.lat;
    const endLng = destination.lng;

    try {
        // 2. Check Cache
        const cached = await prisma.routeCache.findFirst({
            where: {
                startLat,
                startLng,
                endLat,
                endLng
            }
        });

        if (cached) {
            logger.info(`Cache Hit!`, { start: { lat: startLat, lng: startLng }, end: { lat: endLat, lng: endLng }, service: 'RouteCache' });
            return {
                distance: cached.distance,
                duration: cached.duration,
                path: JSON.parse(cached.pathJson)
            };
        }

        // 3. API Call
        logger.info(`Cache Miss. Fetching from TMap...`, { service: 'RouteCache' });
        const result = await getWalkingRoute(origin, destination);

        if (result) {
            // 4. Save to Cache
            try {
                await prisma.routeCache.create({
                    data: {
                        startLat,
                        startLng,
                        endLat,
                        endLng,
                        distance: result.distance,
                        duration: result.duration,
                        pathJson: JSON.stringify(result.path)
                    }
                });
                logger.info(`Saved new route.`, { service: 'RouteCache' });
            } catch (saveErr) {
                logger.error("Failed to save route", { error: saveErr, service: 'RouteCache' });
                // Non-blocking error, carry on
            }
        }

        return result;

    } catch (e) {
        logger.error("Error in route service", { error: e, service: 'RouteService' });
        // Fallback to direct API if DB fails
        return getWalkingRoute(origin, destination);
    }
}
