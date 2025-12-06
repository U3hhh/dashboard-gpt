import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';
import type { CreateGroupInput } from '@/lib/types/database';

// GET /api/groups - List groups with member counts
export async function GET() {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        const { data: groups, error } = await supabase
            .from('groups')
            .select('*')
            .eq('organization_id', authResult.context.organizationId)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json(
                { error: 'Query failed', message: error.message },
                { status: 500 }
            );
        }

        // Get member counts for each group
        const groupIds = groups?.map(g => g.id) || [];
        let memberCounts: Record<string, number> = {};

        if (groupIds.length > 0) {
            const { data: memberships } = await supabase
                .from('group_subscribers')
                .select('group_id')
                .in('group_id', groupIds);

            if (memberships) {
                memberCounts = memberships.reduce((acc, m) => {
                    acc[m.group_id] = (acc[m.group_id] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);
            }
        }

        const enrichedData = groups?.map(group => ({
            ...group,
            member_count: memberCounts[group.id] || 0,
        }));

        return NextResponse.json(enrichedData || []);
    } catch (error) {
        console.error('Groups list error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const body: CreateGroupInput = await request.json();

        if (!body.name) {
            return NextResponse.json(
                { error: 'Missing field', message: 'name is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('groups')
            .insert({
                organization_id: authResult.context.organizationId,
                name: body.name,
                description: body.description || null,
                color: body.color || null,
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
            action: ActivityActions.GROUP_CREATED,
            entityType: 'group',
            entityId: data.id,
            details: { name: body.name },
        });

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Group creation error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
