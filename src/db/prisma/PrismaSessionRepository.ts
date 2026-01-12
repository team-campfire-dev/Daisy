import prisma from '@/lib/db';
import { ISessionRepository, Session } from '../interfaces/ISessionRepository';
import { randomUUID } from 'crypto';
import { logger } from '@/lib/logger';

/**
 * Prisma implementation of ISessionRepository
 */
export class PrismaSessionRepository implements ISessionRepository {
    async createSession(expiresInDays: number = 30): Promise<Session> {
        try {
            const sessionId = randomUUID();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

            const session = await prisma.session.create({
                data: {
                    sessionId,
                    expiresAt,
                    lastActive: now,
                },
            });

            logger.info(`Created session: ${sessionId}`, { service: 'SessionRepo' });
            return session;
        } catch (error) {
            logger.error('Failed to create session', { error, service: 'SessionRepo' });
            throw error;
        }
    }

    async getSession(sessionId: string): Promise<Session | null> {
        try {
            const session = await prisma.session.findUnique({
                where: { sessionId },
            });

            // Check if session is expired
            if (session && new Date(session.expiresAt) < new Date()) {
                logger.info(`Session ${sessionId} is expired, deleting...`, { service: 'SessionRepo' });
                await this.deleteSession(sessionId);
                return null;
            }

            return session;
        } catch (error) {
            logger.error('Failed to get session', { error, service: 'SessionRepo' });
            return null;
        }
    }

    async updateLastActive(sessionId: string): Promise<void> {
        try {
            await prisma.session.update({
                where: { sessionId },
                data: {
                    lastActive: new Date(),
                },
            });
        } catch (error) {
            logger.error('Failed to update last active', { error, service: 'SessionRepo' });
            // Don't throw - this is non-critical
        }
    }

    async deleteExpiredSessions(): Promise<number> {
        try {
            const result = await prisma.session.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
            });

            logger.info(`Deleted ${result.count} expired sessions`, { service: 'SessionRepo' });
            return result.count;
        } catch (error) {
            logger.error('Failed to delete expired sessions', { error, service: 'SessionRepo' });
            return 0;
        }
    }

    async deleteSession(sessionId: string): Promise<void> {
        try {
            await prisma.session.delete({
                where: { sessionId },
            });
            logger.info(`Deleted session: ${sessionId}`, { service: 'SessionRepo' });
        } catch (error) {
            logger.error('Failed to delete session', { error, service: 'SessionRepo' });
            throw error;
        }
    }
}

// Export singleton instance
export const prismaSessionRepository = new PrismaSessionRepository();
