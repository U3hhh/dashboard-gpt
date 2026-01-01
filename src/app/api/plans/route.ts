import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate, isDemoMode } from '@/lib/supabase/middleware';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';
import type { CreatePlanInput } from '@/lib/types/database';
import { mockPlans } from '@/lib/mock-data';

// GET /api/plans - List all plans
export async function GET() {
    try {
        // Check if demo mode is enabled via cookie
        if (await isDemoMode()) {
            return NextResponse.json(mockPlans);
        }

        // Authenticate - return error if not logged in
        const authResult = await authenticate();
        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('organization_id', authResult.context.organizationId)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json(
                { error: 'Query failed', message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Plans list error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// POST /api/plans - Create a new plan
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const body: CreatePlanInput = await request.json();

        if (!body.name || body.price === undefined || !body.period_value || !body.period_unit) {
            return NextResponse.json(
                { error: 'Missing fields', message: 'name, price, period_value, and period_unit are required' },
                { status: 400 }
            );
        }

        const validUnits = ['day', 'week', 'month', 'year'];
        if (!validUnits.includes(body.period_unit)) {
            return NextResponse.json(
                { error: 'Invalid period_unit', message: 'period_unit must be one of: day, week, month, year' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('plans')
            .insert({
                organization_id: authResult.context.organizationId,
                name: body.name,
                description: body.description || null,
                price: body.price,
                period_value: body.period_value,
                period_unit: body.period_unit,
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
        await logActivity({
            userId: authResult.context.userId,
            organizationId: authResult.context.organizationId,
            action: ActivityActions.PLAN_CREATED,
            entityType: 'plan',
            entityId: data.id,
            details: { name: body.name, price: body.price },
        });

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Plan creation error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
