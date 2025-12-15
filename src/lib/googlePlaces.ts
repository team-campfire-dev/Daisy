import { cache } from 'react';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export interface GooglePlace {
    placeId: string;
    title: string;
    address: string;
    location: {
        lat: number;
        lng: number;
    };
    rating?: number;
    userRatingCount?: number;
    photoUrl?: string;
    category?: string;
    openNow?: boolean;
    priceLevel?: string; // "PRICE_LEVEL_MODERATE" etc.
    website?: string;
}

/**
 * Search for places using Google Places Text Search (New)
 * We first get IDs, then details.
 */
export async function searchGooglePlaces(query: string, limit: number = 3): Promise<GooglePlace[]> {
    if (!GOOGLE_API_KEY) {
        console.warn("GOOGLE_PLACES_API_KEY missing.");
        return [];
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';

    try {
        console.log(`[GooglePlaces] Searching for: ${query}`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                // FieldMask: Request only needed fields to save costs/latency
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos,places.types,places.regularOpeningHours.openNow,places.priceLevel,places.websiteUri'
            },
            body: JSON.stringify({
                textQuery: query,
                languageCode: 'ko',
                maxResultCount: limit,
            }),
        });

        if (!response.ok) {
            console.error(`[GooglePlaces] Error ${response.status}: ${await response.text()}`);
            return [];
        }

        const data = await response.json();
        if (!data.places) return [];

        return data.places.map((place: any) => {
            let photoUrl = undefined;
            if (place.photos && place.photos.length > 0) {
                // Construct Photo URL (max width 400px)
                const photoRef = place.photos[0].name; // "places/PLACE_ID/photos/PHOTO_ID"
                photoUrl = `https://places.googleapis.com/v1/${photoRef}/media?key=${GOOGLE_API_KEY}&maxWidthPx=400`;
            }

            return {
                placeId: place.id,
                title: place.displayName?.text || query,
                address: place.formattedAddress,
                location: {
                    lat: place.location.latitude,
                    lng: place.location.longitude,
                },
                rating: place.rating,
                userRatingCount: place.userRatingCount,
                photoUrl: photoUrl,
                category: place.types ? place.types[0] : undefined,
                openNow: place.regularOpeningHours?.openNow,
                website: place.websiteUri
            };
        });

    } catch (error) {
        console.error("[GooglePlaces] Exception:", error);
        return [];
    }
}
// ... existing imports

/**
 * Decodes an encoded polyline string into an array of coordinates.
 * Sourced from Google Maps Polyline Algorithm.
 */
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
    const poly: { lat: number; lng: number }[] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return poly;
}

export interface RouteInfo {
    distanceMeters: number;
    duration: string; // "123s" format
    polyline: { lat: number; lng: number }[];
}

/**
 * Calculate Walking Route using Google Routes API
 */
export async function getWalkingRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
): Promise<{ info: RouteInfo | null; error?: string }> {
    if (!GOOGLE_API_KEY) return { info: null, error: "API Key Missing" };

    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

    try {
        const requestBody = {
            origin: {
                location: { latLng: { latitude: origin.lat, longitude: origin.lng } }
            },
            destination: {
                location: { latLng: { latitude: destination.lat, longitude: destination.lng } }
            },
            travelMode: 'WALK',
            // routingPreference removed for WALK mode
            computeAlternativeRoutes: false
        };
        console.log("[GoogleRoutes] Request Body:", JSON.stringify(requestBody, null, 2));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline'
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[GoogleRoutes] Error ${response.status}: ${errText}`);
            // Fallback: Straight line
            return {
                info: {
                    distanceMeters: 0,
                    duration: "0s",
                    polyline: [origin, destination]
                },
                error: `HTTP ${response.status} (Fallback Used)`
            };
        }

        const data = await response.json();
        if (!data.routes || data.routes.length === 0) {
            // Fallback: Straight line
            return {
                info: {
                    distanceMeters: 0,
                    duration: "0s",
                    polyline: [origin, destination]
                },
                error: "No routes found (Fallback Used)"
            };
        }

        const route = data.routes[0];
        return {
            info: {
                distanceMeters: route.distanceMeters,
                duration: route.duration,
                polyline: decodePolyline(route.polyline.encodedPolyline)
            }
        };

    } catch (error) {
        console.error("[GoogleRoutes] Exception:", error);
        // Fallback: Straight line
        return {
            info: {
                distanceMeters: 0,
                duration: "0s",
                polyline: [origin, destination]
            },
            error: `Exception: ${String(error)} (Fallback Used)`
        };
    }
}
