import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';
import { isMockMode, mockOrganization } from '@/lib/mock-data';

// GET /api/settings/organization - Get organization settings
export async function GET() {
    try {
        // Return mock data if Supabase is not configured
        if (isMockMode()) {
            return NextResponse.json(mockOrganization);
        }

        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', authResult.context.organizationId)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: 'Not found', message: 'Organization not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Organization settings error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// PUT /api/settings/organization - Update organization settings
export async function PUT(request: NextRequest) {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const { name } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: 'Missing field', message: 'name is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        const { data, error } = await supabase
            .from('organizations')
            .update({ name })
            .eq('id', orgId)
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
            action: ActivityActions.ORGANIZATION_UPDATED,
            entityType: 'organization',
            entityId: orgId,
            details: { name },
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('Organization update error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
