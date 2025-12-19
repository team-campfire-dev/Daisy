import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Cookie configuration options
 */
export interface SessionCookieOptions {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
}

/**
 * Get session ID from cookies
 */
export async function getSessionCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    return sessionCookie?.value;
}

/**
 * Set session ID cookie
 */
export async function setSessionCookie(
    sessionId: string,
    options?: SessionCookieOptions
): Promise<void> {
    const cookieStore = await cookies();

    const cookieOptions = {
        maxAge: options?.maxAge || COOKIE_MAX_AGE,
        httpOnly: options?.httpOnly !== false, // default true
        secure: options?.secure !== false && process.env.NODE_ENV === 'production', // only secure in production
        sameSite: (options?.sameSite || 'lax') as 'lax' | 'strict' | 'none',
        path: '/',
    };

    cookieStore.set(SESSION_COOKIE_NAME, sessionId, cookieOptions);
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}
