import { DatabaseContainer } from '@/db/container';
import { GooglePlace } from '@/lib/googlePlaces';

// Re-export Place interface for backward compatibility
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
    openingHours: string | null; // Stored as JSON string
    cachedAt: Date;
    updatedAt: Date;
}

/**
 * Upsert a place from Google Places API into the database
 * Now uses DI container instead of direct Prisma access
 */
export async function upsertGooglePlace(place: GooglePlace) {
    const placeRepo = DatabaseContainer.getPlaceRepository();
    await placeRepo.upsertPlace(place);
}

/**
 * Search places in DB within a radius (meters) of a center point.
 * Now uses DI container instead of direct Prisma access
 */
export async function findNearbyPlaces(
    lat: number,
    lng: number,
    radiusMeters: number = 2000,
    limit: number = 20
) {
    const placeRepo = DatabaseContainer.getPlaceRepository();
    return await placeRepo.findNearby(lat, lng, radiusMeters, limit);
}

/**
 * Text search in DB (Case insensitive LIKE)
 * Now uses DI container instead of direct Prisma access
 */
export async function searchPlacesByText(query: string) {
    const placeRepo = DatabaseContainer.getPlaceRepository();
    return await placeRepo.searchByText(query);
}

/**
 * Find a place by ID
 */
export async function findPlaceById(id: string) {
    const placeRepo = DatabaseContainer.getPlaceRepository();
    return await placeRepo.findById(id);
}

/**
 * Get all places with pagination
 */
export async function getAllPlaces(skip: number = 0, take: number = 50) {
    const placeRepo = DatabaseContainer.getPlaceRepository();
    return await placeRepo.findAll(skip, take);
}

