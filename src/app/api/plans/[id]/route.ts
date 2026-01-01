import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';
import type { UpdatePlanInput } from '@/lib/types/database';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/plans/[id] - Get plan details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('id', id)
            .eq('organization_id', authResult.context.organizationId)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: 'Not found', message: 'Plan not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Plan fetch error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// PUT /api/plans/[id] - Update plan
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const body: UpdatePlanInput = await request.json();
        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        // Check if plan exists
        const { data: existing } = await supabase
            .from('plans')
            .select('id')
            .eq('id', id)
            .eq('organization_id', orgId)
            .single();

        if (!existing) {
            return NextResponse.json(
                { error: 'Not found', message: 'Plan not found' },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.price !== undefined) updateData.price = body.price;
        if (body.period_value !== undefined) updateData.period_value = body.period_value;
        if (body.period_unit !== undefined) updateData.period_unit = body.period_unit;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;

        const { data, error } = await supabase
            .from('plans')
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
            action: ActivityActions.PLAN_UPDATED,
            entityType: 'plan',
            entityId: id,
            details: updateData,
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('Plan update error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// DELETE /api/plans/[id] - Delete plan
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        // Get plan name for logging
        const { data: plan } = await supabase
            .from('plans')
            .select('name')
            .eq('id', id)
            .eq('organization_id', orgId)
            .single();

        const { error } = await supabase
            .from('plans')
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
            action: ActivityActions.PLAN_DELETED,
            entityType: 'plan',
            entityId: id,
            details: { name: plan?.name },
        });

        return NextResponse.json({ success: true, message: 'Plan deleted' });
    } catch (error) {
        console.error('Plan deletion error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
