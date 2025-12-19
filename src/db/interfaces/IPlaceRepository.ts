import { Place } from '@/services/placeService';
import { GooglePlace } from '@/lib/googlePlaces';

/**
 * Repository interface for Place operations
 */
export interface IPlaceRepository {
    /**
     * Insert or update a place from Google Places API
     */
    upsertPlace(place: GooglePlace): Promise<void>;

    /**
     * Find places within a radius of a center point
     * @param lat - Center latitude
     * @param lng - Center longitude
     * @param radiusMeters - Search radius in meters
     * @param limit - Maximum number of results
     */
    findNearby(
        lat: number,
        lng: number,
        radiusMeters: number,
        limit: number
    ): Promise<(Place & { distance: number })[]>;

    /**
     * Search places by text query (title or address)
     */
    searchByText(query: string): Promise<Place[]>;

    /**
     * Find a single place by ID
     */
    findById(id: string): Promise<Place | null>;

    /**
     * Get all places with optional pagination
     */
    findAll(skip?: number, take?: number): Promise<Place[]>;
}
