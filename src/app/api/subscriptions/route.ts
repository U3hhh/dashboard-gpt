import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate, isDemoMode } from '@/lib/supabase/middleware';
import { getPaginationParams, createPaginatedResponse, getSupabaseRange } from '@/lib/utils/pagination';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';
import type { CreateSubscriptionInput } from '@/lib/types/database';
import { mockSubscriptions, mockSubscribers, mockPlans } from '@/lib/mock-data';

// GET /api/subscriptions - List subscriptions with pagination and filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const search = searchParams.get('search');

        // Check if demo mode is enabled via cookie
        if (await isDemoMode()) {
            const today = new Date().toISOString().split('T')[0];
            let filtered = mockSubscriptions.map(s => {
                if (s.status === 'active' && s.end_date < today) {
                    return { ...s, status: 'expired' as const };
                }
                return s;
            });


            // Deduplicate: per subscriber, keep the "best" status
            // BUT only do this for the main list, not if specifically filtering for history or unpaid
            const paymentStatus = searchParams.get('payment_status');
            const subscriberId = searchParams.get('subscriber_id');
            const isUnpaidFilter = paymentStatus === 'unpaid';
            const isHistoryRequest = subscriberId !== null;

            if (!isUnpaidFilter && !isHistoryRequest) {
                const subscriberStatusMap: Record<string, typeof filtered[0]> = {};
                filtered.forEach(s => {
                    const subId = s.subscriber_id;
                    const existing = subscriberStatusMap[subId];
                    if (!existing) {
                        subscriberStatusMap[subId] = s;
                    } else {
                        const ranks: Record<string, number> = { active: 3, pending: 2, expired: 1, cancelled: 0 };
                        const rankNew = ranks[s.status] || 0;
                        const rankOld = ranks[existing.status] || 0;

                        if (rankNew > rankOld) {
                            subscriberStatusMap[subId] = s;
                        } else if (rankNew === rankOld) {
                            if (new Date(s.end_date) > new Date(existing.end_date)) {
                                subscriberStatusMap[subId] = s;
                            }
                        }
                    }
                });
                filtered = Object.values(subscriberStatusMap);
            }

            // Apply filters AFTER deduplication
            if (status) {
                filtered = filtered.filter(s => s.status === status);
            }

            if (paymentStatus) {
                filtered = filtered.filter(s => s.payment_status === paymentStatus);
            }
            if (search) {
                const searchLower = search.toLowerCase();
                filtered = filtered.filter(s =>
                    s.subscriber?.name.toLowerCase().includes(searchLower) ||
                    s.subscriber?.email.toLowerCase().includes(searchLower)
                );
            }

            // Final Sort
            filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const start = (page - 1) * limit;
            const paged = filtered.slice(start, start + limit);
            return NextResponse.json({
                data: paged,
                total: filtered.length,
                page,
                limit,
                totalPages: Math.ceil(filtered.length / limit),
            });
        }

        // Authenticate - return error if not logged in
        const authResult = await authenticate();
        if (!authResult.success) {
            return authResult.error;
        }


        const supabase = await createClient();

        // Automatically expire subscriptions that have passed their end date
        await supabase.rpc('auto_expire_subscriptions');

        const paginationParams = getPaginationParams(searchParams);
        const { from, to } = getSupabaseRange(paginationParams);

        // Filter options (status already defined above)
        const paymentStatus = searchParams.get('payment_status');
        const subscriberId = searchParams.get('subscriber_id');
        const expiringSoon = searchParams.get('expiring_soon') === 'true';

        // Build query
        // Use !inner for subscriber if search is present to filter by joined table correctly
        let selectStr = `
        *,
        subscriber:subscribers${search ? '!inner' : ''}(id, name, email, phone),
        plan:plans(id, name, price)
      `;

        let query = supabase
            .from('subscriptions')
            .select(selectStr, { count: 'exact' })
            .eq('organization_id', (authResult as any).context.organizationId);

        // Apply sorting
        if (expiringSoon) {
            query = query.order('end_date', { ascending: true });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        // Apply filters (only those that are safe to apply before deduplication)
        if (paymentStatus) {
            query = query.eq('payment_status', paymentStatus);
        }
        if (subscriberId) {
            query = query.eq('subscriber_id', subscriberId);
        }
        if (search) {
            query = query.ilike('subscriber.name', `%${search}%`);
        }
        if (expiringSoon) {
            const today = new Date().toISOString().split('T')[0];
            const sevenDaysLater = new Date();
            sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
            const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0];

            query = query
                .gte('end_date', today)
                .lte('end_date', sevenDaysLaterStr);
        }

        // Fetch ALL matching subscriptions without applying the 'status' filter yet
        const { data, count, error } = await query;

        if (error) {
            return NextResponse.json(
                { error: 'Query failed', message: error.message },
                { status: 500 }
            );
        }

        let resultData = data || [];

        // Deduplicate: per subscriber, keep the "best" status if not specific request
        const isUnpaidFilter = paymentStatus === 'unpaid';
        const isHistoryRequest = subscriberId !== null;

        if (!isUnpaidFilter && !isHistoryRequest) {
            const subscriberStatusMap: Record<string, any> = {};
            const ranks: Record<string, number> = { active: 3, pending: 2, expired: 1, cancelled: 0 };

            resultData.forEach((s: any) => {
                const subId = s.subscriber_id;
                const existing = subscriberStatusMap[subId];
                if (!existing) {
                    subscriberStatusMap[subId] = s;
                } else {
                    const rankNew = ranks[s.status] || 0;
                    const rankOld = ranks[existing.status] || 0;

                    if (rankNew > rankOld) {
                        subscriberStatusMap[subId] = s;
                    } else if (rankNew === rankOld) {
                        if (new Date(s.end_date) > new Date(existing.end_date)) {
                            subscriberStatusMap[subId] = s;
                        }
                    }
                }
            });
            resultData = Object.values(subscriberStatusMap);
        }

        // Apply 'status' filter AFTER deduplication
        if (status) {
            resultData = resultData.filter((s: any) => s.status === status);
        }

        // Sort final results by created_at DESC (unless expiringSoon was True)
        if (!expiringSoon) {
            resultData.sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        }

        // Recalculate pagination since we did filtering/deduplication in memory
        const totalItems = resultData.length;
        const totalPages = Math.ceil(totalItems / (paginationParams.limit || 10));

        // Slicing for pagination
        const start = (paginationParams.page - 1) * paginationParams.limit;
        const end = start + paginationParams.limit;
        const slicedData = resultData.slice(start, end);

        return NextResponse.json({
            data: slicedData,
            total: totalItems,
            page: paginationParams.page,
            limit: paginationParams.limit,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Subscriptions list error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// POST /api/subscriptions - Create a new subscription
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const body: CreateSubscriptionInput = await request.json();

        if (!body.subscriber_id || !body.price || !body.start_date || !body.end_date) {
            return NextResponse.json(
                { error: 'Missing fields', message: 'subscriber_id, price, start_date, and end_date are required' },
                { status: 400 }
            );
        }

        if (await isDemoMode()) {
            const subscriber = mockSubscribers.find(s => s.id === body.subscriber_id);
            const plan = mockPlans.find(p => p.id === body.plan_id);

            // Count existing subscriptions for this subscriber in mock data
            const existingCount = mockSubscriptions.filter(s => s.subscriber_id === body.subscriber_id).length;
            const newRenewalCount = existingCount + 1;

            const data = {
                id: Math.random().toString(36).substring(2, 9),
                organization_id: (authResult as any).context.organizationId,
                subscriber_id: body.subscriber_id,
                plan_id: body.plan_id || null,
                price: body.price,
                start_date: body.start_date,
                end_date: body.end_date,
                notes: body.notes || null,
                status: body.status || 'active',
                payment_status: body.payment_status || 'unpaid',
                renewal_count: newRenewalCount,
                subscriber: subscriber,
                plan: plan,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            // Add to mock activity for history to work in demo mode
            const { mockActivity } = require('@/lib/mock-data');
            mockActivity.push({
                id: Math.random().toString(36).substring(2, 9),
                action: newRenewalCount > 1 ? ActivityActions.SUBSCRIPTION_UPDATED : ActivityActions.SUBSCRIPTION_CREATED,
                entity_type: 'subscription',
                entity_id: data.id,
                created_at: new Date().toISOString(),
                details: {
                    subscriber_id: body.subscriber_id,
                    price: body.price,
                    type: newRenewalCount > 1 ? 'renewal' : 'initial',
                    renewal_count: newRenewalCount,
                    start_date: body.start_date,
                    end_date: body.end_date,
                    notes: body.notes,
                    plan_id: body.plan_id,
                    plan_name: plan?.name,
                    status: body.status || 'active',
                    payment_status: body.payment_status || 'unpaid'
                }
            });

            // Add new subscription to mock list
            mockSubscriptions.push(data as any);
            return NextResponse.json(data, { status: 201 });
        }

        const supabase = await createClient();

        // Count existing subscriptions for this subscriber to determine renewal_count
        const { count: existingCount, error: countError } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('subscriber_id', body.subscriber_id);

        if (countError) {
            console.error('Fetch existing subscriptions error:', countError);
        }

        const newRenewalCount = (existingCount || 0) + 1;

        // Create a new subscription record
        const { data, error } = await supabase
            .from('subscriptions')
            .insert({
                organization_id: (authResult as any).context.organizationId,
                subscriber_id: body.subscriber_id,
                plan_id: body.plan_id || null,
                price: body.price,
                start_date: body.start_date,
                end_date: body.end_date,
                notes: body.notes || null,
                status: body.status || 'active',
                payment_status: body.payment_status || 'unpaid',
                renewal_count: newRenewalCount,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: 'Creation failed', message: error.message },
                { status: 500 }
            );
        }

        // Fetch plan name for log
        let planName = 'Custom';
        if (body.plan_id) {
            const { data: plan } = await supabase.from('plans').select('name').eq('id', body.plan_id).single();
            if (plan) planName = plan.name;
        }

        // Log activity
        await logActivity({
            userId: (authResult as any).context.userId,
            organizationId: (authResult as any).context.organizationId,
            action: newRenewalCount > 1 ? ActivityActions.SUBSCRIPTION_UPDATED : ActivityActions.SUBSCRIPTION_CREATED,
            entityType: 'subscription',
            entityId: data.id,
            details: {
                subscriber_id: body.subscriber_id,
                price: body.price,
                type: newRenewalCount > 1 ? 'renewal' : 'initial',
                renewal_count: newRenewalCount,
                start_date: body.start_date,
                end_date: body.end_date,
                notes: body.notes,
                plan_id: body.plan_id,
                plan_name: planName,
                status: body.status || 'active',
                payment_status: body.payment_status || 'unpaid'
            },
        });

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Subscription creation/renewal error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
