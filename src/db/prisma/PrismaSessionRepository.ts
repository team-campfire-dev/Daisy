import prisma from '@/lib/db';
import { ISessionRepository, Session } from '../interfaces/ISessionRepository';
import { randomUUID } from 'crypto';

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

            console.log(`[SessionRepo] Created session: ${sessionId}`);
            return session;
        } catch (error) {
            console.error('[SessionRepo] Failed to create session:', error);
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
                console.log(`[SessionRepo] Session ${sessionId} is expired, deleting...`);
                await this.deleteSession(sessionId);
                return null;
            }

            return session;
        } catch (error) {
            console.error('[SessionRepo] Failed to get session:', error);
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
            console.error('[SessionRepo] Failed to update last active:', error);
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

            console.log(`[SessionRepo] Deleted ${result.count} expired sessions`);
            return result.count;
        } catch (error) {
            console.error('[SessionRepo] Failed to delete expired sessions:', error);
            return 0;
        }
    }

    async deleteSession(sessionId: string): Promise<void> {
        try {
            await prisma.session.delete({
                where: { sessionId },
            });
            console.log(`[SessionRepo] Deleted session: ${sessionId}`);
        } catch (error) {
            console.error('[SessionRepo] Failed to delete session:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const prismaSessionRepository = new PrismaSessionRepository();
