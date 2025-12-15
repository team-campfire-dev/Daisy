'use server';

import prisma from '@/lib/db';
import { Place } from '@prisma/client';

export interface GetPlacesParams {
    query?: string;
    category?: string;
    page?: number;
    limit?: number;
}

export interface GetPlacesResponse {
    places: Place[];
    hasMore: boolean;
    total: number;
}

export async function getPlaces({
    query = '',
    category = 'All',
    page = 1,
    limit = 20,
}: GetPlacesParams): Promise<GetPlacesResponse> {
    try {
        const skip = (page - 1) * limit;

        const where: any = {};

        // Search Filter
        if (query) {
            where.OR = [
                { title: { contains: query } },
                { address: { contains: query } },
            ];
        }

        // Category Filter
        if (category && category !== 'All') {
            where.category = { contains: category };
        }

        const [places, total] = await Promise.all([
            prisma.place.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    updatedAt: 'desc',
                },
            }),
            prisma.place.count({ where }),
        ]);

        return {
            places,
            hasMore: skip + places.length < total,
            total,
        };
    } catch (error) {
        console.error('Error fetching places:', error);
        return { places: [], hasMore: false, total: 0 };
    }
}
