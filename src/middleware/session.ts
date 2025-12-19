import { NextResponse } from 'next/server';
import { getSessionCookie, setSessionCookie } from '@/lib/cookies';
import { SessionService } from '@/services/sessionService';

/**
 * Session middleware for API routes
 * Ensures every request has a valid session
 * 
 * Usage in API route:
 * ```ts
 * import { withSession } from '@/middleware/session';
 * 
 * export const GET = withSession(async (request, session) => {
 *   // session is guaranteed to exist
 *   return NextResponse.json({ sessionId: session.sessionId });
 * });
 * ```
 */
export function withSession<T>(
    handler: (request: Request, session: { sessionId: string }) => Promise<T>
) {
    return async (request: Request): Promise<T> => {
        // Get session ID from cookie
        const cookieSessionId = await getSessionCookie();

        // Create or retrieve session
        const session = await SessionService.createOrGetSession(cookieSessionId);

        // Set cookie if new session or update existing
        await setSessionCookie(session.sessionId);

        // Call the actual handler with session context
        return handler(request, { sessionId: session.sessionId });
    };
}

/**
 * Get or create session for the current request
 * Helper function for API routes that don't use withSession middleware
 */
export async function getOrCreateSession(): Promise<{ sessionId: string }> {
    const cookieSessionId = await getSessionCookie();
    const session = await SessionService.createOrGetSession(cookieSessionId);
    await setSessionCookie(session.sessionId);
    return { sessionId: session.sessionId };
}
