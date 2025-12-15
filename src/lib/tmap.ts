const TMAP_API_KEY = process.env.TMAP_API_KEY;

export interface RouteInfo {
    distance: number; // meters
    duration: number; // seconds
    path: { lat: number; lng: number }[];
}

/**
 * Calculate Walking Route using TMap API
 * docs: https://tmapapi.sktelecom.com/main.html#webservice/docs/tmapRoutePedestrian
 */
export async function getWalkingRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
): Promise<RouteInfo | null> {
    if (!TMAP_API_KEY) {
        console.warn("TMAP_API_KEY missing.");
        return null;
    }

    const url = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json';

    try {
        console.log(`[TMap] Routing (${origin.lat},${origin.lng}) -> (${destination.lat},${destination.lng})`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'appKey': TMAP_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                startX: origin.lng,
                startY: origin.lat,
                endX: destination.lng,
                endY: destination.lat,
                reqCoordType: "WGS84GEO",
                resCoordType: "WGS84GEO",
                startName: "Origin",
                endName: "Destination"
            })
        });

        if (!response.ok) {
            console.error(`[TMap] Error ${response.status}: ${await response.text()}`);
            return null;
        }

        const data = await response.json();

        if (data.features) {
            let totalDistance = 0; // meters
            let totalTime = 0; // seconds
            const path: { lat: number; lng: number }[] = [];

            data.features.forEach((feature: any) => {
                if (feature.geometry.type === 'LineString') {
                    feature.geometry.coordinates.forEach((coord: number[]) => {
                        path.push({ lng: coord[0], lat: coord[1] });
                    });
                }

                if (feature.properties) {
                    if (feature.properties.totalDistance) totalDistance += feature.properties.totalDistance;
                    if (feature.properties.totalTime) totalTime += feature.properties.totalTime;
                }
            });

            // TMap returns total stats in the first feature usually, but let's trust the properties or sum them if split
            // The first feature is Point (Start), usually containing total properties.
            if (data.features[0].properties) {
                totalDistance = data.features[0].properties.totalDistance;
                totalTime = data.features[0].properties.totalTime;
            }

            return {
                distance: totalDistance,
                duration: totalTime,
                path: path
            };
        }

        return null;

    } catch (error) {
        console.error("[TMap] Exception:", error);
        return null;
    }
}
