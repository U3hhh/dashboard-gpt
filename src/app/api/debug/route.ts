import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

// GET /api/debug - Debug authentication and cookies
export async function GET() {
    try {
        const cookieStore = await cookies();
        const demoCookie = cookieStore.get('demo_mode');

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        let userData = null;
        let orgData = null;

        if (user) {
            const { data: userRow } = await supabase
                .from('users')
                .select('id, email, name, role, organization_id, is_active')
                .eq('id', user.id)
                .single();
            userData = userRow;

            if (userRow?.organization_id) {
                const { data: org } = await supabase
                    .from('organizations')
                    .select('id, name')
                    .eq('id', userRow.organization_id)
                    .single();
                orgData = org;
            }
        }

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            cookies: {
                demo_mode: demoCookie?.value || null,
            },
            auth: {
                authenticated: !!user,
                userId: user?.id || null,
                email: user?.email || null,
                error: authError?.message || null,
            },
            user: userData,
            organization: orgData,
            debug: {
                shouldUseMockData: demoCookie?.value === 'true',
                hasValidAuth: !!user && !!userData?.organization_id,
            }
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({
            error: 'Debug failed',
            message: String(error),
        }, { status: 500 });
    }
}
