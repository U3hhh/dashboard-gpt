import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';
import type { UpdateSubscriberInput } from '@/lib/types/database';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/subscribers/[id] - Get subscriber with subscription history
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        // Get subscriber details
        const { data: subscriber, error } = await supabase
            .from('subscribers')
            .select('*')
            .eq('id', id)
            .eq('organization_id', orgId)
            .single();

        if (error || !subscriber) {
            return NextResponse.json(
                { error: 'Not found', message: 'Subscriber not found' },
                { status: 404 }
            );
        }

        // Get subscription history
        const { data: subscriptions } = await supabase
            .from('subscriptions')
            .select(`
        *,
        plan:plans(id, name, price)
      `)
            .eq('subscriber_id', id)
            .order('created_at', { ascending: false });

        // Get groups
        const { data: groupMemberships } = await supabase
            .from('group_subscribers')
            .select(`
        group:groups(id, name, color)
      `)
            .eq('subscriber_id', id);

        const groups = groupMemberships?.map(gm => gm.group).filter(Boolean) || [];

        return NextResponse.json({
            ...subscriber,
            subscriptions: subscriptions || [],
            groups,
        });
    } catch (error) {
        console.error('Subscriber fetch error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// PUT /api/subscribers/[id] - Update subscriber
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const body: UpdateSubscriberInput = await request.json();
        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        // Check if subscriber exists
        const { data: existing } = await supabase
            .from('subscribers')
            .select('id')
            .eq('id', id)
            .eq('organization_id', orgId)
            .single();

        if (!existing) {
            return NextResponse.json(
                { error: 'Not found', message: 'Subscriber not found' },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.email !== undefined) updateData.email = body.email;
        if (body.phone !== undefined) updateData.phone = body.phone;
        if (body.address !== undefined) updateData.address = body.address;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;

        const { data, error } = await supabase
            .from('subscribers')
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
            organizationId: orgId,
            action: ActivityActions.SUBSCRIBER_UPDATED,
            entityType: 'subscriber',
            entityId: id,
            details: updateData,
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('Subscriber update error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// DELETE /api/subscribers/[id] - Delete subscriber
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        // Get subscriber name for logging
        const { data: subscriber } = await supabase
            .from('subscribers')
            .select('name')
            .eq('id', id)
            .eq('organization_id', authResult.context.organizationId)
            .single();

        const { error } = await supabase
            .from('subscribers')
            .delete()
            .eq('id', id)
            .eq('organization_id', authResult.context.organizationId);

        if (error) {
            return NextResponse.json(
                { error: 'Deletion failed', message: error.message },
                { status: 500 }
            );
        }

        // Log activity
        await logActivity({
            userId: authResult.context.userId,
            organizationId: authResult.context.organizationId,
            action: ActivityActions.SUBSCRIBER_DELETED,
            entityType: 'subscriber',
            entityId: id,
            details: { name: subscriber?.name },
        });

        return NextResponse.json({ success: true, message: 'Subscriber deleted' });
    } catch (error) {
        console.error('Subscriber deletion error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
