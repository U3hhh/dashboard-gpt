import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';

// PUT /api/groups/[id] - Update a group
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authenticate();
        if (!authResult.success) return authResult.error;

        const { id } = await params;
        const body = await request.json();
        const { name, description, color } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Missing field', message: 'name is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify ownership
        const { data: existingGroup } = await supabase
            .from('groups')
            .select('id')
            .eq('id', id)
            .eq('organization_id', authResult.context.organizationId)
            .single();

        if (!existingGroup) {
            return NextResponse.json(
                { error: 'Not found', message: 'Group not found' },
                { status: 404 }
            );
        }

        const { data, error } = await supabase
            .from('groups')
            .update({
                name,
                description: description || null,
                color: color || null,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: 'Update failed', message: error.message },
                { status: 500 }
            );
        }

        await logActivity({
            userId: authResult.context.userId,
            organizationId: authResult.context.organizationId,
            action: ActivityActions.GROUP_UPDATED,
            entityType: 'group',
            entityId: id,
            details: { name },
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

// DELETE /api/groups/[id] - Delete a group
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authenticate();
        if (!authResult.success) return authResult.error;

        const { id } = await params;
        const supabase = await createClient();

        // Verify ownership
        const { data: existingGroup } = await supabase
            .from('groups')
            .select('id, name')
            .eq('id', id)
            .eq('organization_id', authResult.context.organizationId)
            .single();

        if (!existingGroup) {
            return NextResponse.json(
                { error: 'Not found', message: 'Group not found' },
                { status: 404 }
            );
        }

        const { error } = await supabase
            .from('groups')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json(
                { error: 'Delete failed', message: error.message },
                { status: 500 }
            );
        }

        await logActivity({
            userId: authResult.context.userId,
            organizationId: authResult.context.organizationId,
            action: ActivityActions.GROUP_DELETED,
            entityType: 'group',
            entityId: id,
            details: { name: existingGroup.name },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Group delete error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
