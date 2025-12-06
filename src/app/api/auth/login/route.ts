import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Missing credentials', message: 'Email and password are required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return NextResponse.json(
                { error: 'Authentication failed', message: error.message },
                { status: 401 }
            );
        }

        // Get user's organization info
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('organization_id, role')
            .eq('id', data.user.id)
            .single();

        if (userError || !userData?.organization_id) {
            return NextResponse.json(
                { error: 'User profile not found', message: 'User is not associated with an organization' },
                { status: 403 }
            );
        }

        // Log the login activity
        await logActivity({
            userId: data.user.id,
            organizationId: userData.organization_id,
            action: ActivityActions.USER_LOGIN,
            entityType: 'user',
            entityId: data.user.id,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: data.user.id,
                email: data.user.email,
                role: userData.role,
                organizationId: userData.organization_id,
            },
            session: {
                accessToken: data.session.access_token,
                expiresAt: data.session.expires_at,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
