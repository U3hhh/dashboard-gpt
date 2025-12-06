import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';
import type { UpdateGroupInput } from '@/lib/types/database';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/groups/[id] - Get group with members
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        const { data: group, error } = await supabase
            .from('groups')
            .select('*')
            .eq('id', id)
            .eq('organization_id', orgId)
            .single();

        if (error || !group) {
            return NextResponse.json(
                { error: 'Not found', message: 'Group not found' },
                { status: 404 }
            );
        }

        // Get group members
        const { data: memberships } = await supabase
            .from('group_subscribers')
            .select(`
        subscriber:subscribers(id, name, email, phone, is_active)
      `)
            .eq('group_id', id);

        const members = memberships?.map(m => m.subscriber).filter(Boolean) || [];

        return NextResponse.json({
            ...group,
            members,
            member_count: members.length,
        });
    } catch (error) {
        console.error('Group fetch error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// PUT /api/groups/[id] - Update group
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const body: UpdateGroupInput = await request.json();
        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        // Check if group exists
        const { data: existing } = await supabase
            .from('groups')
            .select('id')
            .eq('id', id)
            .eq('organization_id', orgId)
            .single();

        if (!existing) {
            return NextResponse.json(
                { error: 'Not found', message: 'Group not found' },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.color !== undefined) updateData.color = body.color;

        const { data, error } = await supabase
            .from('groups')
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
            action: ActivityActions.GROUP_UPDATED,
            entityType: 'group',
            entityId: id,
            details: updateData,
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('Group update error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// DELETE /api/groups/[id] - Delete group
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        // Get group name for logging
        const { data: group } = await supabase
            .from('groups')
            .select('name')
            .eq('id', id)
            .eq('organization_id', orgId)
            .single();

        const { error } = await supabase
            .from('groups')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId);

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
            action: ActivityActions.GROUP_DELETED,
            entityType: 'group',
            entityId: id,
            details: { name: group?.name },
        });

        return NextResponse.json({ success: true, message: 'Group deleted' });
    } catch (error) {
        console.error('Group deletion error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
