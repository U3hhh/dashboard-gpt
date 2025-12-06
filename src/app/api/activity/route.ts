import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { getPaginationParams, createPaginatedResponse, getSupabaseRange } from '@/lib/utils/pagination';
import { isMockMode, mockActivity } from '@/lib/mock-data';

// GET /api/activity - List activity logs with filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        // Return mock data if Supabase is not configured
        if (isMockMode()) {
            return NextResponse.json({
                data: mockActivity.slice(0, limit),
                total: mockActivity.length,
                page: 1,
                limit,
                totalPages: 1,
            });
        }

        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();
        const paginationParams = getPaginationParams(searchParams);
        const { from, to } = getSupabaseRange(paginationParams);

        // Filter options
        const entityType = searchParams.get('entity_type');
        const entityId = searchParams.get('entity_id');
        const userId = searchParams.get('user_id');

        // Build query
        let query = supabase
            .from('activity_logs')
            .select(`
        *,
        user:users(id, email)
      `, { count: 'exact' })
            .eq('organization_id', authResult.context.organizationId)
            .order('created_at', { ascending: false });

        if (entityType) {
            query = query.eq('entity_type', entityType);
        }
        if (entityId) {
            query = query.eq('entity_id', entityId);
        }
        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            return NextResponse.json(
                { error: 'Query failed', message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            createPaginatedResponse(data || [], count || 0, paginationParams.page, paginationParams.limit)
        );
    } catch (error) {
        console.error('Activity logs error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
