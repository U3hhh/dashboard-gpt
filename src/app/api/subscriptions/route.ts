import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { getPaginationParams, createPaginatedResponse, getSupabaseRange } from '@/lib/utils/pagination';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';
import type { CreateSubscriptionInput } from '@/lib/types/database';

// GET /api/subscriptions - List subscriptions with pagination and filtering
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const paginationParams = getPaginationParams(searchParams);
        const { from, to } = getSupabaseRange(paginationParams);

        // Filter options
        const status = searchParams.get('status');
        const paymentStatus = searchParams.get('payment_status');
        const subscriberId = searchParams.get('subscriber_id');

        // Build query
        let query = supabase
            .from('subscriptions')
            .select(`
        *,
        subscriber:subscribers(id, name, email, phone),
        plan:plans(id, name, price)
      `, { count: 'exact' })
            .eq('organization_id', authResult.context.organizationId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }
        if (paymentStatus) {
            query = query.eq('payment_status', paymentStatus);
        }
        if (subscriberId) {
            query = query.eq('subscriber_id', subscriberId);
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            return NextResponse.json(
                { error: 'Query failed', message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            createPaginatedResponse(data || [], count || 0, paginationParams.page, paginationParams.limit)
        );
    } catch (error) {
        console.error('Subscriptions list error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// POST /api/subscriptions - Create a new subscription
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const body: CreateSubscriptionInput = await request.json();

        if (!body.subscriber_id || !body.price || !body.start_date || !body.end_date) {
            return NextResponse.json(
                { error: 'Missing fields', message: 'subscriber_id, price, start_date, and end_date are required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('subscriptions')
            .insert({
                organization_id: authResult.context.organizationId,
                subscriber_id: body.subscriber_id,
                plan_id: body.plan_id || null,
                price: body.price,
                start_date: body.start_date,
                end_date: body.end_date,
                notes: body.notes || null,
                status: 'active',
                payment_status: 'unpaid',
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
        await logActivity({
            userId: authResult.context.userId,
            organizationId: authResult.context.organizationId,
            action: ActivityActions.SUBSCRIPTION_CREATED,
            entityType: 'subscription',
            entityId: data.id,
            details: { subscriber_id: body.subscriber_id, price: body.price },
        });

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Subscription creation error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
