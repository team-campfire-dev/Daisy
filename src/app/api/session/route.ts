import { NextResponse } from 'next/server';
import { withSession } from '@/middleware/session';
import { SessionService } from '@/services/sessionService';

/**
 * GET /api/session
 * Get or create a session
 */
export const GET = withSession(async (request, session) => {
    const fullSession = await SessionService.getSession(session.sessionId);

    if (!fullSession) {
        return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
        );
    }

    return NextResponse.json({
        sessionId: fullSession.sessionId,
        createdAt: fullSession.createdAt,
        expiresAt: fullSession.expiresAt,
        lastActive: fullSession.lastActive,
    });
});

/**
 * DELETE /api/session
 * Clear the current session
 */
export const DELETE = withSession(async (request, session) => {
    await SessionService.deleteSession(session.sessionId);

    return NextResponse.json({
        message: 'Session deleted',
    });
});
