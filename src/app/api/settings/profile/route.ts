import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';

// GET /api/settings/profile - Get user profile
export async function GET() {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        // Get user info
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authResult.context.userId)
            .single();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Not found', message: 'User not found' },
                { status: 404 }
            );
        }

        // Get organization info
        const { data: org } = await supabase
            .from('organizations')
            .select('id, name, is_active')
            .eq('id', user.organization_id)
            .single();

        return NextResponse.json({
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            organization: org || null,
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
