import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Check Auth User
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                step: 'Auth Check',
                status: 'Failed',
                error: authError || 'No user found'
            });
        }

        // 2. Check User Profile
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        // 3. Check Organization
        let orgData = null;
        let orgError = null;
        if (userProfile?.organization_id) {
            const orgRes = await supabase
                .from('organizations')
                .select('*')
                .eq('id', userProfile.organization_id)
                .single();
            orgData = orgRes.data;
            orgError = orgRes.error;
        }

        // 4. Check Data Visibility (RLS Check)
        const { count: subscriberCount, error: subError } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact', head: true });

        const { count: subCountWithOrg, error: subOrgError } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', userProfile?.organization_id || 'none');

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            auth: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            profile: {
                found: !!userProfile,
                data: userProfile,
                error: profileError
            },
            organization: {
                id: userProfile?.organization_id,
                found: !!orgData,
                data: orgData,
                error: orgError
            },
            dataCheck: {
                totalSubscribersVisible: subscriberCount,
                subscribersInOrg: subCountWithOrg,
                errors: {
                    general: subError,
                    orgSpecific: subOrgError
                }
            }
        }, { status: 200 });

    } catch (e) {
        return NextResponse.json({
            error: 'Server Error',
            details: String(e)
        }, { status: 500 });
    }
}
