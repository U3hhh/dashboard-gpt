import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate, isDemoMode } from '@/lib/supabase/middleware';

// GET /api/activity - List activity logs
export async function GET(request: NextRequest) {
    try {
        if (await isDemoMode()) {
            const { mockActivity } = require('@/lib/mock-data');
            const searchParams = request.nextUrl.searchParams;
            const entityId = searchParams.get('entity_id');
            const entityType = searchParams.get('entity_type');
            const subscriberId = searchParams.get('subscriber_id');

            let filtered = [...mockActivity];
            if (entityId) filtered = filtered.filter((log: any) => log.entity_id === entityId);
            if (entityType) filtered = filtered.filter((log: any) => log.entity_type === entityType);
            if (subscriberId) {
                filtered = filtered.filter((log: any) =>
                    log.details?.subscriber_id === subscriberId ||
                    (log.entity_type === 'subscriber' && log.entity_id === subscriberId)
                );
            }

            return NextResponse.json(filtered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        }

        const authResult = await authenticate();
        if (!authResult.success) return authResult.error;

        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '50');

        const entityId = searchParams.get('entity_id');
        const entityType = searchParams.get('entity_type');
        const subscriberId = searchParams.get('subscriber_id');

        let query = supabase
            .from('activity_logs')
            .select(`
                *,
                users (name, email)
            `)
            .eq('organization_id', authResult.context.organizationId);

        if (entityId) {
            query = query.eq('entity_id', entityId);
        }

        if (entityType) {
            query = query.eq('entity_type', entityType);
        }

        if (subscriberId) {
            // Find all subscription IDs for this subscriber
            const { data: subs } = await supabase
                .from('subscriptions')
                .select('id')
                .eq('subscriber_id', subscriberId);

            const subIds = subs?.map(s => s.id) || [];

            // Filter by subscriber or any of their subscriptions
            if (subIds.length > 0) {
                query = query.or(`and(entity_type.eq.subscription,entity_id.in.(${subIds.join(',')})),and(entity_type.eq.subscriber,entity_id.eq.${subscriberId})`);
            } else {
                query = query.eq('entity_type', 'subscriber').eq('entity_id', subscriberId);
            }
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            return NextResponse.json(
                { error: 'Query failed', message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Activity logs error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
