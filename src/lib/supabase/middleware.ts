import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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
    isDemo?: boolean; // Flag if this is demo mode
}

/**
 * Check if the request is in demo mode (via cookie)
 */
export async function isDemoMode(): Promise<boolean> {
    try {
        const cookieStore = await cookies();
        const demoCookie = cookieStore.get('demo_mode');
        return demoCookie?.value === 'true';
    } catch {
        return false;
    }
}

/**
 * Authenticate the request and return user context
 * Use this in API routes to verify the user is logged in
 * Auto-creates user profile and organization on first login
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
        let { data: userData, error: userError } = await supabase
            .from('users')
            .select('organization_id, role, name')
            .eq('id', user.id)
            .single();

        // If user doesn't exist, auto-create profile
        if (userError || !userData) {
            // Create a new organization for this user
            // We use the user's name or email to name the organization
            const orgName = (user.email?.split('@')[0] || 'My') + "'s Organization";

            const { data: newOrg, error: orgError } = await supabase
                .from('organizations')
                .insert({
                    name: orgName,
                    is_active: true,
                })
                .select('id')
                .single();

            if (orgError) {
                console.error('Failed to create organization:', orgError);
                return {
                    success: false,
                    error: NextResponse.json(
                        { error: 'Setup failed', message: 'Failed to create organization' },
                        { status: 500 }
                    ),
                };
            }

            // Create user profile with head_of_project role
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    id: user.id,
                    email: user.email,
                    name: user.email?.split('@')[0] || 'User',
                    organization_id: newOrg.id,
                    role: 'head_of_project',
                    is_active: true,
                })
                .select('organization_id, role, name')
                .single();

            if (createError) {
                console.error('Failed to create user profile:', createError);
                return {
                    success: false,
                    error: NextResponse.json(
                        { error: 'Setup failed', message: 'Failed to create user profile: ' + createError.message },
                        { status: 500 }
                    ),
                };
            }

            userData = newUser;
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

/**
 * Require admin or head_of_project role
 */
export async function requireManager(): Promise<AuthResult> {
    const authResult = await authenticate();

    if (!authResult.success) {
        return authResult;
    }

    if (!['admin', 'head_of_project'].includes(authResult.context.role)) {
        return {
            success: false,
            error: NextResponse.json(
                { error: 'Forbidden', message: 'Manager access required' },
                { status: 403 }
            ),
        };
    }

    return authResult;
}
