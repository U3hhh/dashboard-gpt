import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';

export async function POST() {
    try {
        const authResult = await authenticate();

        const supabase = await createClient();

        // Log logout if user was authenticated
        if (authResult.success) {
            await logActivity({
                userId: authResult.context.userId,
                organizationId: authResult.context.organizationId,
                action: ActivityActions.USER_LOGOUT,
                entityType: 'user',
                entityId: authResult.context.userId,
            });
        }

        const { error } = await supabase.auth.signOut();

        if (error) {
            return NextResponse.json(
                { error: 'Logout failed', message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
