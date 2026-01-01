import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate, isDemoMode } from '@/lib/supabase/middleware';
import { getPaginationParams, createPaginatedResponse, getSupabaseRange } from '@/lib/utils/pagination';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';
import type { CreateSubscriberInput } from '@/lib/types/database';
import { mockSubscribers, mockSubscriptions } from '@/lib/mock-data';

// GET /api/subscribers - List subscribers with pagination
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.toLowerCase();
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        // Check if demo mode is enabled via cookie
        if (await isDemoMode()) {
            let filtered = mockSubscribers.map(sub => ({
                ...sub,
                subscription_count: mockSubscriptions.filter(s => s.subscriber_id === sub.id).length,
            }));
            if (search) {
                filtered = filtered.filter(s =>
                    s.name.toLowerCase().includes(search) ||
                    s.email?.toLowerCase().includes(search) ||
                    s.phone?.includes(search)
                );
            }
            const start = (page - 1) * limit;
            const paged = filtered.slice(start, start + limit);
            return NextResponse.json({
                data: paged,
                total: filtered.length,
                page,
                limit,
                totalPages: Math.ceil(filtered.length / limit),
            });
        }

        // Authenticate - return error if not logged in
        const authResult = await authenticate();
        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();
        const paginationParams = getPaginationParams(searchParams);
        const { from, to } = getSupabaseRange(paginationParams);

        // Search/filter options (search already defined above)
        const isActive = searchParams.get('is_active');

        // Build query
        let query = supabase
            .from('subscribers')
            .select('*', { count: 'exact' })
            .eq('organization_id', authResult.context.organizationId)
            .order('created_at', { ascending: false });

        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }
        if (isActive !== null) {
            query = query.eq('is_active', isActive === 'true');
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            return NextResponse.json(
                { error: 'Query failed', message: error.message },
                { status: 500 }
            );
        }

        // Get subscription counts for each subscriber
        const subscriberIds = data?.map(s => s.id) || [];
        let subscriptionCounts: Record<string, number> = {};

        if (subscriberIds.length > 0) {
            const { data: subscriptions } = await supabase
                .from('subscriptions')
                .select('subscriber_id')
                .in('subscriber_id', subscriberIds);

            if (subscriptions) {
                subscriptionCounts = subscriptions.reduce((acc, sub) => {
                    acc[sub.subscriber_id] = (acc[sub.subscriber_id] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);
            }
        }

        const enrichedData = data?.map(subscriber => ({
            ...subscriber,
            subscription_count: subscriptionCounts[subscriber.id] || 0,
        }));

        return NextResponse.json(
            createPaginatedResponse(enrichedData || [], count || 0, paginationParams.page, paginationParams.limit)
        );
    } catch (error) {
        console.error('Subscribers list error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// POST /api/subscribers - Create a new subscriber
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const body: CreateSubscriberInput = await request.json();

        if (!body.name) {
            return NextResponse.json(
                { error: 'Missing field', message: 'name is required' },
                { status: 400 }
            );
        }

        if (await isDemoMode()) {
            const data = {
                id: Math.random().toString(36).substring(2, 9),
                organization_id: (authResult as any).context.organizationId,
                name: body.name,
                email: body.email || null,
                phone: body.phone || null,
                address: body.address || null,
                notes: body.notes || null,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            mockSubscribers.push(data as any);
            return NextResponse.json(data, { status: 201 });
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('subscribers')
            .insert({
                organization_id: (authResult as any).context.organizationId,
                name: body.name,
                email: body.email || null,
                phone: body.phone || null,
                address: body.address || null,
                notes: body.notes || null,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: 'Creation failed', message: error.message },
                { status: 500 }
            );
        }

        // Log activity
        // Log activity
        await logActivity({
            userId: (authResult as any).context.userId,
            organizationId: (authResult as any).context.organizationId,
            action: ActivityActions.SUBSCRIBER_CREATED,
            entityType: 'subscriber',
            entityId: data.id,
            details: { name: body.name },
        });

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Subscriber creation error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
