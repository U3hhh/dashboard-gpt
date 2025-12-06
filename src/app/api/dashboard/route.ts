import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { toISODate, daysFromNow, startOfMonth, endOfMonth } from '@/lib/utils/date';
import type { DashboardStats } from '@/lib/types/database';

export async function GET() {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        // Get total subscribers count
        const { count: totalSubscribers } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('is_active', true);

        // Get active subscriptions count
        const { count: activeSubscriptions } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('status', 'active');

        // Get unpaid subscriptions count
        const { count: unpaidCount } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('payment_status', 'unpaid');

        // Get monthly revenue (sum of payments this month)
        const monthStart = toISODate(startOfMonth());
        const monthEnd = toISODate(endOfMonth());

        const { data: monthlyPayments } = await supabase
            .from('payments')
            .select('amount')
            .eq('organization_id', orgId)
            .gte('paid_at', monthStart)
            .lte('paid_at', monthEnd);

        const monthlyRevenue = monthlyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        // Get subscriptions expiring in next 7 days
        const today = toISODate(new Date());
        const sevenDaysLater = toISODate(daysFromNow(7));

        const { data: expiringSubscriptions } = await supabase
            .from('subscriptions')
            .select(`
        *,
        subscriber:subscribers(id, name, email, phone),
        plan:plans(id, name)
      `)
            .eq('organization_id', orgId)
            .eq('status', 'active')
            .gte('end_date', today)
            .lte('end_date', sevenDaysLater)
            .order('end_date', { ascending: true })
            .limit(10);

        const stats: DashboardStats = {
            totalSubscribers: totalSubscribers || 0,
            activeSubscriptions: activeSubscriptions || 0,
            monthlyRevenue,
            unpaidCount: unpaidCount || 0,
            expiringSubscriptions: expiringSubscriptions || [],
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
