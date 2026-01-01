import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate, isDemoMode } from '@/lib/supabase/middleware';
import type { AnalyticsData } from '@/lib/types/database';

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
    try {
        if (await isDemoMode()) {
            const { mockSubscriptions, mockSubscribers, mockPayments } = require('@/lib/mock-data');

            const subscriptionCounts = {
                active: mockSubscriptions.filter((s: any) => s.status === 'active').length,
                expired: mockSubscriptions.filter((s: any) => s.status === 'expired').length,
                cancelled: mockSubscriptions.filter((s: any) => s.status === 'cancelled').length,
                pending: mockSubscriptions.filter((s: any) => s.status === 'pending').length,
            };

            const data: AnalyticsData = {
                revenue: {
                    labels: ['Jan', 'Feb', 'Mar'],
                    data: [150000, 220000, 180000],
                },
                subscriptions: subscriptionCounts,
                subscribers: {
                    total: mockSubscribers.length,
                    active: mockSubscribers.filter((s: any) => s.is_active).length,
                    inactive: mockSubscribers.filter((s: any) => !s.is_active).length,
                },
                trends: [
                    { date: '2024-01-01', revenue: 50000, subscriptions: 5, subscribers: 3 },
                    { date: '2024-02-01', revenue: 75000, subscriptions: 8, subscribers: 6 },
                ],
            };
            return NextResponse.json(data);
        }

        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'month'; // week, month, year
        const orgId = authResult.context.organizationId;

        // Calculate date range based on period
        const now = new Date();
        let startDate: Date;
        let dateFormat: string;

        switch (period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                dateFormat = 'day';
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                dateFormat = 'month';
                break;
            case 'month':
            default:
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                dateFormat = 'day';
                break;
        }

        const startDateStr = startDate.toISOString().split('T')[0];

        // Get subscription status counts
        const { data: subscriptionStats } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('organization_id', orgId);

        const subscriptionCounts = {
            active: 0,
            expired: 0,
            cancelled: 0,
            pending: 0,
        };

        subscriptionStats?.forEach(sub => {
            if (sub.status in subscriptionCounts) {
                subscriptionCounts[sub.status as keyof typeof subscriptionCounts]++;
            }
        });

        // Get subscriber counts
        const { count: totalSubscribers } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId);

        const { count: activeSubscribers } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('is_active', true);

        // Get payments for revenue data
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, paid_at')
            .eq('organization_id', orgId)
            .gte('paid_at', startDateStr)
            .order('paid_at', { ascending: true });

        // Group payments by date for revenue trends
        const revenueByDate: Record<string, number> = {};
        payments?.forEach(payment => {
            const date = new Date(payment.paid_at);
            let key: string;

            if (dateFormat === 'month') {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else {
                key = date.toISOString().split('T')[0];
            }

            revenueByDate[key] = (revenueByDate[key] || 0) + Number(payment.amount);
        });

        const revenueLabels = Object.keys(revenueByDate).sort();
        const revenueData = revenueLabels.map(label => revenueByDate[label]);

        // Get trends data (subscriptions and subscribers created over time)
        const { data: subscriptionTrends } = await supabase
            .from('subscriptions')
            .select('created_at')
            .eq('organization_id', orgId)
            .gte('created_at', startDateStr);

        const { data: subscriberTrends } = await supabase
            .from('subscribers')
            .select('created_at')
            .eq('organization_id', orgId)
            .gte('created_at', startDateStr);

        // Build trends array
        const trendsMap: Record<string, { revenue: number; subscriptions: number; subscribers: number }> = {};

        revenueLabels.forEach(date => {
            trendsMap[date] = { revenue: revenueByDate[date] || 0, subscriptions: 0, subscribers: 0 };
        });

        subscriptionTrends?.forEach(sub => {
            const date = new Date(sub.created_at);
            let key: string;
            if (dateFormat === 'month') {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else {
                key = date.toISOString().split('T')[0];
            }
            if (!trendsMap[key]) {
                trendsMap[key] = { revenue: 0, subscriptions: 0, subscribers: 0 };
            }
            trendsMap[key].subscriptions++;
        });

        subscriberTrends?.forEach(sub => {
            const date = new Date(sub.created_at);
            let key: string;
            if (dateFormat === 'month') {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else {
                key = date.toISOString().split('T')[0];
            }
            if (!trendsMap[key]) {
                trendsMap[key] = { revenue: 0, subscriptions: 0, subscribers: 0 };
            }
            trendsMap[key].subscribers++;
        });

        const trends = Object.keys(trendsMap)
            .sort()
            .map(date => ({
                date,
                ...trendsMap[date],
            }));

        const analyticsData: AnalyticsData = {
            revenue: {
                labels: revenueLabels,
                data: revenueData,
            },
            subscriptions: subscriptionCounts,
            subscribers: {
                total: totalSubscribers || 0,
                active: activeSubscribers || 0,
                inactive: (totalSubscribers || 0) - (activeSubscribers || 0),
            },
            trends,
        };

        return NextResponse.json(analyticsData);
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
