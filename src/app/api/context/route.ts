import { NextResponse } from 'next/server';
import { withSession } from '@/middleware/session';
import { CacheService } from '@/services/cacheService';

const CONTEXT_CACHE_KEY = 'user_context';
const CHAT_HISTORY_CACHE_KEY = 'chat_history';

export const GET = withSession(async (request, session) => {
    try {
        const url = new URL(request.url);
        const type = url.searchParams.get('type'); // 'context' or 'history'

        if (type === 'history') {
            const history = await CacheService.getCachedRoute(session.sessionId, CHAT_HISTORY_CACHE_KEY);
            const suggestions = await CacheService.getCachedRoute(session.sessionId, 'chat_suggestions');
            const plans = await CacheService.getCachedRoute(session.sessionId, 'course_plans');
            const selectedPlanId = await CacheService.getCachedRoute(session.sessionId, 'selected_plan_id');

            return NextResponse.json({
                history: history || [],
                suggestions: suggestions || [],
                plans: plans || [],
                selectedPlanId: selectedPlanId || null
            });
        }

        // Default: get context
        const cache = await CacheService.getCachedRoute(session.sessionId, CONTEXT_CACHE_KEY);
        return NextResponse.json({ context: cache });
    } catch (error) {
        console.error('[API] Failed to get data:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve data' },
            { status: 500 }
        );
    }
});

export const POST = withSession(async (request, session) => {
    try {
        const body = await request.json();
        const { context, history, suggestions, plans, selectedPlanId } = body;

        if (context) {
            await CacheService.cacheRoute(session.sessionId, CONTEXT_CACHE_KEY, context);
        }

        if (history !== undefined) {
            await CacheService.cacheRoute(session.sessionId, CHAT_HISTORY_CACHE_KEY, history);
        }

        if (suggestions !== undefined) {
            await CacheService.cacheRoute(session.sessionId, 'chat_suggestions', suggestions);
        }

        if (plans !== undefined) {
            await CacheService.cacheRoute(session.sessionId, 'course_plans', plans);
        }

        if (selectedPlanId !== undefined) {
            await CacheService.cacheRoute(session.sessionId, 'selected_plan_id', selectedPlanId);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Failed to save data:', error);
        return NextResponse.json(
            { error: 'Failed to save data' },
            { status: 500 }
        );
    }
});
