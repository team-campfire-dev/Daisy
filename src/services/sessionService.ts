import { logger } from '@/lib/logger';
import { DatabaseContainer } from '@/db/container';
import { Session } from '@/db/interfaces/ISessionRepository';

/**
 * High-level session management service
 */
export class SessionService {
    /**
     * Create a new session or retrieve existing session by ID
     * @param cookieSessionId - Optional session ID from cookie
     * @returns Session object
     */
    static async createOrGetSession(cookieSessionId?: string): Promise<Session> {
        const sessionRepo = DatabaseContainer.getSessionRepository();

        // If we have a session ID from cookie, try to retrieve it
        if (cookieSessionId) {
            const existing = await sessionRepo.getSession(cookieSessionId);
            if (existing) {
                // Update last active timestamp
                await sessionRepo.updateLastActive(cookieSessionId);
                logger.info(`Retrieved existing session: ${cookieSessionId}`, { service: 'SessionService' });
                return existing;
            }
        }

        // Create new session
        const newSession = await sessionRepo.createSession();
        logger.info(`Created new session: ${newSession.sessionId}`, { service: 'SessionService' });
        return newSession;
    }

    /**
     * Refresh session's last active timestamp
     */
    static async refreshSession(sessionId: string): Promise<void> {
        const sessionRepo = DatabaseContainer.getSessionRepository();
        await sessionRepo.updateLastActive(sessionId);
    }

    /**
     * Get session by ID
     */
    static async getSession(sessionId: string): Promise<Session | null> {
        const sessionRepo = DatabaseContainer.getSessionRepository();
        return await sessionRepo.getSession(sessionId);
    }

    /**
     * Delete a specific session
     */
    static async deleteSession(sessionId: string): Promise<void> {
        const sessionRepo = DatabaseContainer.getSessionRepository();
        await sessionRepo.deleteSession(sessionId);
    }

    /**
     * Cleanup expired sessions
     * Should be called periodically (e.g., via cron job)
     */
    static async cleanupSessions(): Promise<number> {
        const sessionRepo = DatabaseContainer.getSessionRepository();
        return await sessionRepo.deleteExpiredSessions();
    }
}
