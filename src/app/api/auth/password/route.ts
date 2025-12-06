import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';

export async function PUT(request: NextRequest) {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Missing passwords', message: 'Current and new password are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Weak password', message: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify current password by attempting to sign in
        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: authResult.context.email,
            password: currentPassword,
        });

        if (verifyError) {
            return NextResponse.json(
                { error: 'Invalid password', message: 'Current password is incorrect' },
                { status: 401 }
            );
        }

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            return NextResponse.json(
                { error: 'Update failed', message: updateError.message },
                { status: 500 }
            );
        }

        // Log the password change
        await logActivity({
            userId: authResult.context.userId,
            organizationId: authResult.context.organizationId,
            action: ActivityActions.USER_PASSWORD_CHANGED,
            entityType: 'user',
            entityId: authResult.context.userId,
        });

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
