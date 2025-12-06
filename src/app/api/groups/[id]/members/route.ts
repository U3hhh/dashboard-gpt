import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/groups/[id]/members - Add member to group
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: groupId } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const { subscriber_id } = await request.json();

        if (!subscriber_id) {
            return NextResponse.json(
                { error: 'Missing field', message: 'subscriber_id is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        // Verify group belongs to organization
        const { data: group } = await supabase
            .from('groups')
            .select('id, name')
            .eq('id', groupId)
            .eq('organization_id', orgId)
            .single();

        if (!group) {
            return NextResponse.json(
                { error: 'Not found', message: 'Group not found' },
                { status: 404 }
            );
        }

        // Verify subscriber belongs to organization
        const { data: subscriber } = await supabase
            .from('subscribers')
            .select('id, name')
            .eq('id', subscriber_id)
            .eq('organization_id', orgId)
            .single();

        if (!subscriber) {
            return NextResponse.json(
                { error: 'Not found', message: 'Subscriber not found' },
                { status: 404 }
            );
        }

        // Check if already a member
        const { data: existing } = await supabase
            .from('group_subscribers')
            .select('id')
            .eq('group_id', groupId)
            .eq('subscriber_id', subscriber_id)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Already exists', message: 'Subscriber is already a member of this group' },
                { status: 409 }
            );
        }

        // Add member
        const { data, error } = await supabase
            .from('group_subscribers')
            .insert({
                group_id: groupId,
                subscriber_id,
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
            organizationId: orgId,
            action: ActivityActions.GROUP_MEMBER_ADDED,
            entityType: 'group',
            entityId: groupId,
            details: { subscriber_id, subscriber_name: subscriber.name, group_name: group.name },
        });

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Add member error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// DELETE /api/groups/[id]/members - Remove member from group
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: groupId } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const { searchParams } = new URL(request.url);
        const subscriberId = searchParams.get('subscriber_id');

        if (!subscriberId) {
            return NextResponse.json(
                { error: 'Missing field', message: 'subscriber_id query parameter is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        // Verify group belongs to organization
        const { data: group } = await supabase
            .from('groups')
            .select('id, name')
            .eq('id', groupId)
            .eq('organization_id', orgId)
            .single();

        if (!group) {
            return NextResponse.json(
                { error: 'Not found', message: 'Group not found' },
                { status: 404 }
            );
        }

        // Get subscriber name for logging
        const { data: subscriber } = await supabase
            .from('subscribers')
            .select('name')
            .eq('id', subscriberId)
            .single();

        const { error } = await supabase
            .from('group_subscribers')
            .delete()
            .eq('group_id', groupId)
            .eq('subscriber_id', subscriberId);

        if (error) {
            return NextResponse.json(
                { error: 'Deletion failed', message: error.message },
                { status: 500 }
            );
        }

        // Log activity
        await logActivity({
            userId: authResult.context.userId,
            organizationId: orgId,
            action: ActivityActions.GROUP_MEMBER_REMOVED,
            entityType: 'group',
            entityId: groupId,
            details: { subscriber_id: subscriberId, subscriber_name: subscriber?.name, group_name: group.name },
        });

        return NextResponse.json({ success: true, message: 'Member removed from group' });
    } catch (error) {
        console.error('Remove member error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
