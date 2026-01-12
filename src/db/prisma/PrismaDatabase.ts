import prisma from '@/lib/db';
import { IDatabase } from '../interfaces/IDatabase';
import { logger } from '@/lib/logger';

/**
 * Prisma implementation of IDatabase interface
 */
export class PrismaDatabase implements IDatabase {
    async connect(): Promise<void> {
        try {
            await prisma.$connect();
            logger.info('Prisma database connected', { service: 'DB' });
        } catch (error) {
            logger.error('Failed to connect to database', { error, service: 'DB' });
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await prisma.$disconnect();
            logger.info('Prisma database disconnected', { service: 'DB' });
        } catch (error) {
            logger.error('Failed to disconnect from database', { error, service: 'DB' });
            throw error;
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            logger.error('Health check failed', { error, service: 'DB' });
            return false;
        }
    }

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
        return await prisma.$transaction(async () => {
            return await fn();
        });
    }
}

// Export singleton instance
export const prismaDatabase = new PrismaDatabase();
