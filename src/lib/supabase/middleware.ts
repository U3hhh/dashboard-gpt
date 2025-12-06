import { NextResponse } from 'next/server';
import { createClient } from './server';

export interface AuthContext {
    userId: string;
    email: string;
    role: string;
    organizationId: string;
}

export type AuthResult = {
    success: true;
    context: AuthContext;
} | {
    success: false;
    error: NextResponse;
}

/**
 * Authenticate the request and return user context
 * Use this in API routes to verify the user is logged in
 */
export async function authenticate(): Promise<AuthResult> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                success: false,
                error: NextResponse.json(
                    { error: 'Unauthorized', message: 'Please log in to continue' },
                    { status: 401 }
                ),
            };
        }

        // Get user's organization info
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('organization_id, role')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            return {
                success: false,
                error: NextResponse.json(
                    { error: 'User not found', message: 'User profile not found' },
                    { status: 404 }
                ),
            };
        }

        if (!userData.organization_id) {
            return {
                success: false,
                error: NextResponse.json(
                    { error: 'No organization', message: 'User is not associated with an organization' },
                    { status: 403 }
                ),
            };
        }

        return {
            success: true,
            context: {
                userId: user.id,
                email: user.email!,
                role: userData.role,
                organizationId: userData.organization_id,
            },
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return {
            success: false,
            error: NextResponse.json(
                { error: 'Authentication failed', message: 'An error occurred during authentication' },
                { status: 500 }
            ),
        };
    }
}

/**
 * Require admin role for the request
 */
export async function requireAdmin(): Promise<AuthResult> {
    const authResult = await authenticate();

    if (!authResult.success) {
        return authResult;
    }

    if (authResult.context.role !== 'admin') {
        return {
            success: false,
            error: NextResponse.json(
                { error: 'Forbidden', message: 'Admin access required' },
                { status: 403 }
            ),
        };
    }

    return authResult;
}
