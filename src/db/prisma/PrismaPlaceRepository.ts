import prisma from '@/lib/db';
import { IPlaceRepository } from '../interfaces/IPlaceRepository';
import { Place } from '@/services/placeService';
import { GooglePlace } from '@/lib/googlePlaces';

/**
 * Prisma implementation of IPlaceRepository
 */
export class PrismaPlaceRepository implements IPlaceRepository {
    async upsertPlace(place: GooglePlace): Promise<void> {
        try {
            const rawData = JSON.stringify(place);
            const openingHours = place.openingHours ? JSON.stringify(place.openingHours) : null;

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
                    openingHours: openingHours,
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
                    openingHours: openingHours,
                },
            });
            console.log(`[PlaceRepo] Upserted place: ${place.title}`);
        } catch (error) {
            console.error(`[PlaceRepo] Failed to upsert place ${place.title}:`, error);
            throw error;
        }
    }

    async findNearby(
        lat: number,
        lng: number,
        radiusMeters: number,
        limit: number
    ): Promise<(Place & { distance: number })[]> {
        // 1 degree lat is approx 111km
        const delta = (radiusMeters / 1000) * 0.015; // 0.009 with safety margin

        try {
            const potential = await prisma.place.findMany({
                where: {
                    lat: {
                        gte: lat - delta,
                        lte: lat + delta,
                    },
                    lng: {
                        gte: lng - delta,
                        lte: lng + delta,
                    },
                },
                take: 100, // fetch more candidates then filter
            });

            // Precise filter
            const results = potential
                .map((p: Place) => {
                    const dist = this.getDistanceFromLatLonInM(lat, lng, p.lat, p.lng);
                    return { ...p, distance: dist };
                })
                .filter((p) => p.distance <= radiusMeters)
                .sort((a, b) => {
                    // Sort by rating * log(count) for popularity
                    const scoreA = (a.rating || 0) * Math.log10((a.userRatingCount || 0) + 1);
                    const scoreB = (b.rating || 0) * Math.log10((b.userRatingCount || 0) + 1);
                    return scoreB - scoreA;
                })
                .slice(0, limit);

            return results;
        } catch (error) {
            console.error('[PlaceRepo] findNearby error:', error);
            return [];
        }
    }

    async searchByText(query: string): Promise<Place[]> {
        try {
            return await prisma.place.findMany({
                where: {
                    OR: [
                        { title: { contains: query } },
                        { address: { contains: query } },
                    ],
                },
                take: 10,
            });
        } catch (error) {
            console.error('[PlaceRepo] searchByText error:', error);
            return [];
        }
    }

    async findById(id: string): Promise<Place | null> {
        try {
            return await prisma.place.findUnique({
                where: { id },
            });
        } catch (error) {
            console.error('[PlaceRepo] findById error:', error);
            return null;
        }
    }

    async findAll(skip: number = 0, take: number = 50): Promise<Place[]> {
        try {
            return await prisma.place.findMany({
                skip,
                take,
                orderBy: {
                    updatedAt: 'desc',
                },
            });
        } catch (error) {
            console.error('[PlaceRepo] findAll error:', error);
            return [];
        }
    }

    // Helper: haversine formula for distance in meters
    private getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d * 1000;
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}

// Export singleton instance
export const prismaPlaceRepository = new PrismaPlaceRepository();
