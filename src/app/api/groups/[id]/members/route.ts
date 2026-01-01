import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';

// GET /api/groups/[id]/members - List group members
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authenticate();
        if (!authResult.success) return authResult.error;

        const { id } = await params;
        const supabase = await createClient();

        // Verify group ownership
        const { data: group } = await supabase
            .from('groups')
            .select('id')
            .eq('id', id)
            .eq('organization_id', authResult.context.organizationId)
            .single();

        if (!group) {
            return NextResponse.json(
                { error: 'Not found', message: 'Group not found' },
                { status: 404 }
            );
        }

        const { data, error } = await supabase
            .from('group_subscribers')
            .select(`
                subscriber_id,
                subscribers (
                    id,
                    name,
                    email,
                    phone
                )
            `)
            .eq('group_id', id);

        if (error) {
            return NextResponse.json(
                { error: 'Query failed', message: error.message },
                { status: 500 }
            );
        }

        // Flatten the structure
        const members = data.map(item => item.subscribers);

        return NextResponse.json(members);
    } catch (error) {
        console.error('Group members list error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// POST /api/groups/[id]/members - Add member to group
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authenticate();
        if (!authResult.success) return authResult.error;

        const { id } = await params;
        const { subscriber_id } = await request.json();

        if (!subscriber_id) {
            return NextResponse.json(
                { error: 'Missing field', message: 'subscriber_id is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify group ownership
        const { data: group } = await supabase
            .from('groups')
            .select('id, name')
            .eq('id', id)
            .eq('organization_id', authResult.context.organizationId)
            .single();

        if (!group) {
            return NextResponse.json(
                { error: 'Not found', message: 'Group not found' },
                { status: 404 }
            );
        }

        // Verify subscriber ownership
        const { data: subscriber } = await supabase
            .from('subscribers')
            .select('id, name')
            .eq('id', subscriber_id)
            .eq('organization_id', authResult.context.organizationId)
            .single();

        if (!subscriber) {
            return NextResponse.json(
                { error: 'Not found', message: 'Subscriber not found' },
                { status: 404 }
            );
        }

        const { error } = await supabase
            .from('group_subscribers')
            .insert({
                group_id: id,
                subscriber_id: subscriber_id,
            });

        if (error) {
            // Check for duplicate
            if (error.code === '23505') { // unique_violation
                return NextResponse.json(
                    { error: 'Duplicate', message: 'Subscriber is already in the group' },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: 'Add failed', message: error.message },
                { status: 500 }
            );
        }

        await logActivity({
            userId: authResult.context.userId,
            organizationId: authResult.context.organizationId,
            action: ActivityActions.GROUP_MEMBER_ADDED,
            entityType: 'group',
            entityId: id,
            details: { group: group.name, subscriber: subscriber.name },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Add group member error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// DELETE /api/groups/[id]/members - Remove member from group
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authenticate();
        if (!authResult.success) return authResult.error;

        const { id } = await params;
        const { subscriber_id } = await request.json();

        if (!subscriber_id) {
            return NextResponse.json(
                { error: 'Missing field', message: 'subscriber_id is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify group ownership
        const { data: group } = await supabase
            .from('groups')
            .select('id, name')
            .eq('id', id)
            .eq('organization_id', authResult.context.organizationId)
            .single();

        if (!group) {
            return NextResponse.json(
                { error: 'Not found', message: 'Group not found' },
                { status: 404 }
            );
        }

        const { error } = await supabase
            .from('group_subscribers')
            .delete()
            .eq('group_id', id)
            .eq('subscriber_id', subscriber_id);

        if (error) {
            return NextResponse.json(
                { error: 'Remove failed', message: error.message },
                { status: 500 }
            );
        }

        await logActivity({
            userId: authResult.context.userId,
            organizationId: authResult.context.organizationId,
            action: ActivityActions.GROUP_MEMBER_REMOVED,
            entityType: 'group',
            entityId: id,
            details: { group: group.name, subscriber_id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Remove group member error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
