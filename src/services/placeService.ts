import prisma from '@/lib/db';
import { GooglePlace } from '@/lib/googlePlaces';

// Manually define Place interface to avoid Prisma generation issues
export interface Place {
    id: string;
    title: string;
    address: string;
    lat: number;
    lng: number;
    rating: number | null;
    userRatingCount: number | null;
    category: string | null;
    photoUrl: string | null;
    openNow: boolean | null;
    website: string | null;
    rawData: string | null;
    cachedAt: Date;
    updatedAt: Date;
}

// Simple haversine formula for distance in meters
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d * 1000;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export async function upsertGooglePlace(place: GooglePlace) {
    try {
        const rawData = JSON.stringify(place);

        await prisma.place.upsert({
            where: { id: place.placeId },
            update: {
                title: place.title,
                address: place.address,
                lat: place.location.lat,
                lng: place.location.lng,
                rating: place.rating,
                userRatingCount: place.userRatingCount,
                category: place.category,
                photoUrl: place.photoUrl,
                openNow: place.openNow,
                website: place.website,
                rawData: rawData,
                updatedAt: new Date(),
            },
            create: {
                id: place.placeId,
                title: place.title,
                address: place.address,
                lat: place.location.lat,
                lng: place.location.lng,
                rating: place.rating,
                userRatingCount: place.userRatingCount,
                category: place.category,
                photoUrl: place.photoUrl,
                openNow: place.openNow,
                website: place.website,
                rawData: rawData,
            },
        });
        console.log(`[DB] Upserted place: ${place.title}`);
    } catch (error) {
        console.error(`[DB] Failed to upsert place ${place.title}:`, error);
    }
}

/**
 * Search places in DB within a radius (meters) of a center point.
 * We use a rough bounding box first, then precise filter.
 */
export async function findNearbyPlaces(
    lat: number,
    lng: number,
    radiusMeters: number = 2000,
    limit: number = 20
) {
    // 1 degree lat is approx 111km. 1 degree lng varies. 
    // Rough calc for bounding box: 
    // 1km ~ 0.009 degrees
    const delta = (radiusMeters / 1000) * 0.015; // 0.009 with safety margin

    try {
        const potential = await prisma.place.findMany({
            where: {
                lat: {
                    gte: lat - delta,
                    lte: lat + delta
                },
                lng: {
                    gte: lng - delta,
                    lte: lng + delta
                }
            },
            take: 100 // fetch more candidates then filter
        });

        // Precise filter
        const results = potential.map((p: Place) => {
            const dist = getDistanceFromLatLonInM(lat, lng, p.lat, p.lng);
            return { ...p, distance: dist };
        })
            .filter((p: Place & { distance: number }) => p.distance <= radiusMeters)
            .sort((a: Place & { distance: number }, b: Place & { distance: number }) => {
                // Sort by Rating * log(count) or just Rating?
                // Let's sort by userRatingCount (popularity) first for now, or mix.
                // Or simple distance? Usually popular places are better.
                const scoreA = (a.rating || 0) * Math.log10((a.userRatingCount || 0) + 1);
                const scoreB = (b.rating || 0) * Math.log10((b.userRatingCount || 0) + 1);
                return scoreB - scoreA;
            })
            .slice(0, limit);

        return results;

    } catch (e) {
        console.error("[DB] findNearbyPlaces error:", e);
        return [];
    }
}

/**
 * Text search in DB (Case insensitive LIKE)
 */
export async function searchPlacesByText(query: string) {
    try {
        return await prisma.place.findMany({
            where: {
                OR: [
                    { title: { contains: query } }, // SQLite contains is roughly like but might be case sensitive? Prisma usually handles it.
                    { address: { contains: query } }
                ]
            },
            take: 10
        });
    } catch (e) {
        return [];
    }
}
