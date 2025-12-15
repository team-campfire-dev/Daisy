const KAKAO_REST_KEY = process.env.KAKAO_REST_API_KEY;

export interface RouteInfo {
    distance: number; // meters
    duration: number; // seconds
    fare?: {
        taxi: number;
        toll: number;
    };
    path?: { lat: number; lng: number }[]; // Coordinates for Polyline
}

/**
 * Calculate Car Route using Kakao Mobility API
 */
export async function getCarDirection(
    origin: { lat: number, lng: number },
    destination: { lat: number, lng: number }
): Promise<RouteInfo | null> {
    if (!KAKAO_REST_KEY) {
        console.warn("KAKAO_REST_API_KEY missing.");
        return null;
    }

    // Kakao uses format: "longitude,latitude"
    const originStr = `${origin.lng},${origin.lat}`;
    const destStr = `${destination.lng},${destination.lat}`;

    const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${originStr}&destination=${destStr}&priority=RECOMMEND`;

    try {
        console.log(`[KakaoMobility] Routing ${originStr} -> ${destStr}`);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `KakaoAK ${KAKAO_REST_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`[KakaoMobility] Error ${response.status}: ${await response.text()}`);
            return null;
        }

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const summary = route.summary;

            // Extract path for Polyline
            // Sections -> Roads -> Vertexes
            const path: { lat: number; lng: number }[] = [];

            route.sections.forEach((section: any) => {
                section.roads.forEach((road: any) => {
                    for (let i = 0; i < road.vertexes.length; i += 2) {
                        path.push({
                            lng: road.vertexes[i],
                            lat: road.vertexes[i + 1]
                        });
                    }
                });
            });

            return {
                distance: summary.distance,
                duration: summary.duration,
                fare: summary.fare,
                path: path
            };
        }

        return null;

    } catch (error) {
        console.error("[KakaoMobility] Exception:", error);
        return null;
    }
}
