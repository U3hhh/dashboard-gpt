import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';
import type { UpdateSubscriptionInput } from '@/lib/types/database';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/subscriptions/[id] - Get subscription details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('subscriptions')
            .select(`
        *,
        subscriber:subscribers(id, name, email, phone, address),
        plan:plans(id, name, description, price, period_value, period_unit)
      `)
            .eq('id', id)
            .eq('organization_id', authResult.context.organizationId)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: 'Not found', message: 'Subscription not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Subscription fetch error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// PUT /api/subscriptions/[id] - Update subscription
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const body: UpdateSubscriptionInput = await request.json();
        const supabase = await createClient();

        // Check if subscription exists and belongs to org
        const { data: existing } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('id', id)
            .eq('organization_id', authResult.context.organizationId)
            .single();

        if (!existing) {
            return NextResponse.json(
                { error: 'Not found', message: 'Subscription not found' },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (body.status !== undefined) updateData.status = body.status;
        if (body.payment_status !== undefined) updateData.payment_status = body.payment_status;
        if (body.price !== undefined) updateData.price = body.price;
        if (body.end_date !== undefined) updateData.end_date = body.end_date;
        if (body.notes !== undefined) updateData.notes = body.notes;

        const { data, error } = await supabase
            .from('subscriptions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: 'Update failed', message: error.message },
                { status: 500 }
            );
        }

        // Log activity
        await logActivity({
            userId: authResult.context.userId,
            organizationId: authResult.context.organizationId,
            action: ActivityActions.SUBSCRIPTION_UPDATED,
            entityType: 'subscription',
            entityId: id,
            details: updateData,
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('Subscription update error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// DELETE /api/subscriptions/[id] - Delete subscription
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from('subscriptions')
            .delete()
            .eq('id', id)
            .eq('organization_id', authResult.context.organizationId);

        if (error) {
            return NextResponse.json(
                { error: 'Deletion failed', message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: 'Subscription deleted' });
    } catch (error) {
        console.error('Subscription deletion error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
