import { prisma } from '@/lib/prisma';
import { getWalkingRoute, RouteInfo } from '@/lib/tmap';

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
            console.log(`[RouteCache] Hit! (${startLat},${startLng}) -> (${endLat},${endLng})`);
            return {
                distance: cached.distance,
                duration: cached.duration,
                path: JSON.parse(cached.pathJson)
            };
        }

        // 3. API Call
        console.log(`[RouteCache] Miss. Fetching from TMap...`);
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
                console.log(`[RouteCache] Saved new route.`);
            } catch (saveErr) {
                console.error("[RouteCache] Failed to save:", saveErr);
                // Non-blocking error, carry on
            }
        }

        return result;

    } catch (e) {
        console.error("[RouteService] Error:", e);
        // Fallback to direct API if DB fails
        return getWalkingRoute(origin, destination);
    }
}
