import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import type { LogErrorInput } from '@/lib/types/database';

// GET /api/errors - List error logs
export async function GET() {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('error_logs')
            .select('*')
            .eq('organization_id', authResult.context.organizationId)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            return NextResponse.json(
                { error: 'Query failed', message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error logs fetch error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// POST /api/errors - Log a new frontend error
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const body: LogErrorInput = await request.json();

        if (!body.message) {
            return NextResponse.json(
                { error: 'Missing field', message: 'message is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('error_logs')
            .insert({
                organization_id: authResult.context.organizationId,
                user_id: authResult.context.userId,
                message: body.message,
                stack: body.stack || null,
                url: body.url || null,
                user_agent: body.user_agent || null,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: 'Creation failed', message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Error log creation error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// DELETE /api/errors - Clear all error logs
export async function DELETE() {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from('error_logs')
            .delete()
            .eq('organization_id', authResult.context.organizationId);

        if (error) {
            return NextResponse.json(
                { error: 'Deletion failed', message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: 'All error logs cleared' });
    } catch (error) {
        console.error('Error logs clear error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
