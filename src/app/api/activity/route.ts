import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';

// GET /api/activity - List activity logs
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticate();
        if (!authResult.success) return authResult.error;

        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '50');

        const { data, error } = await supabase
            .from('activity_logs')
            .select(`
                *,
                users (name, email)
            `)
            .eq('organization_id', authResult.context.organizationId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            return NextResponse.json(
                { error: 'Query failed', message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Activity logs error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
