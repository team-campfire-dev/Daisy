/**
 * Session data model
 */
export interface Session {
    id: string;
    sessionId: string;
    createdAt: Date;
    expiresAt: Date;
    lastActive: Date;
}

/**
 * Repository interface for Session operations
 */
export interface ISessionRepository {
    /**
     * Create a new session
     * @param expiresInDays - Number of days until session expires (default: 30)
     */
    createSession(expiresInDays?: number): Promise<Session>;

    /**
     * Get session by session ID
     */
    getSession(sessionId: string): Promise<Session | null>;

    /**
     * Update the last active timestamp for a session
     */
    updateLastActive(sessionId: string): Promise<void>;

    /**
     * Delete expired sessions
     * @returns Number of sessions deleted
     */
    deleteExpiredSessions(): Promise<number>;

    /**
     * Delete a specific session
     */
    deleteSession(sessionId: string): Promise<void>;
}
