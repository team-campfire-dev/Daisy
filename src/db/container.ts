import { IDatabase } from './interfaces/IDatabase';
import { IPlaceRepository } from './interfaces/IPlaceRepository';
import { ISessionRepository } from './interfaces/ISessionRepository';
import { ICacheRepository } from './interfaces/ICacheRepository';

import { prismaDatabase } from './prisma/PrismaDatabase';
import { prismaPlaceRepository } from './prisma/PrismaPlaceRepository';
import { prismaSessionRepository } from './prisma/PrismaSessionRepository';
import { prismaCacheRepository } from './prisma/PrismaCacheRepository';

/**
 * Database configuration options
 */
export interface DatabaseConfig {
    type: 'prisma'; // Can be extended to 'mongoose', 'typeorm', etc.
}

/**
 * Dependency Injection Container for database operations
 * Provides a centralized place to access repository instances
 * Allows easy swapping of database implementations
 */
export class DatabaseContainer {
    private static database: IDatabase;
    private static placeRepository: IPlaceRepository;
    private static sessionRepository: ISessionRepository;
    private static cacheRepository: ICacheRepository;
    private static isConfigured = false;

    /**
     * Configure the database container with specific implementations
     * Must be called before using any repositories
     */
    static configure(config: DatabaseConfig = { type: 'prisma' }): void {
        if (this.isConfigured) {
            console.log('[Container] Already configured, skipping...');
            return;
        }

        switch (config.type) {
            case 'prisma':
            default:
                this.database = prismaDatabase;
                this.placeRepository = prismaPlaceRepository;
                this.sessionRepository = prismaSessionRepository;
                this.cacheRepository = prismaCacheRepository;
                break;

            // Future database implementations can be added here:
            // case 'mongoose':
            //   this.database = mongooseDatabase;
            //   this.placeRepository = mongoosePlaceRepository;
            //   ...
        }

        this.isConfigured = true;
        console.log(`[Container] Configured with ${config.type} implementation`);
    }

    /**
     * Get the database instance
     */
    static getDatabase(): IDatabase {
        this.ensureConfigured();
        return this.database;
    }

    /**
     * Get the Place repository instance
     */
    static getPlaceRepository(): IPlaceRepository {
        this.ensureConfigured();
        return this.placeRepository;
    }

    /**
     * Get the Session repository instance
     */
    static getSessionRepository(): ISessionRepository {
        this.ensureConfigured();
        return this.sessionRepository;
    }

    /**
     * Get the Cache repository instance
     */
    static getCacheRepository(): ICacheRepository {
        this.ensureConfigured();
        return this.cacheRepository;
    }

    /**
     * Check if container is configured, auto-configure if not
     */
    private static ensureConfigured(): void {
        if (!this.isConfigured) {
            console.log('[Container] Auto-configuring with default Prisma implementation');
            this.configure();
        }
    }

    /**
     * Reset the container (useful for testing)
     */
    static reset(): void {
        this.isConfigured = false;
    }
}

// Auto-configure on import with default Prisma implementation
DatabaseContainer.configure();
