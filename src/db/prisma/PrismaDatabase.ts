import prisma from '@/lib/db';
import { IDatabase } from '../interfaces/IDatabase';

/**
 * Prisma implementation of IDatabase interface
 */
export class PrismaDatabase implements IDatabase {
    async connect(): Promise<void> {
        try {
            await prisma.$connect();
            console.log('[DB] Prisma database connected');
        } catch (error) {
            console.error('[DB] Failed to connect to database:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await prisma.$disconnect();
            console.log('[DB] Prisma database disconnected');
        } catch (error) {
            console.error('[DB] Failed to disconnect from database:', error);
            throw error;
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            console.error('[DB] Health check failed:', error);
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
