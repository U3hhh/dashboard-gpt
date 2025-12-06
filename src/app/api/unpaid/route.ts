import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate, isDemoMode } from '@/lib/supabase/middleware';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';
import { mockSubscriptions } from '@/lib/mock-data';

// GET /api/unpaid - List unpaid subscriptions
export async function GET() {
    try {
        // Check if demo mode is enabled via cookie
        if (await isDemoMode()) {
            const unpaid = mockSubscriptions.filter(s => s.payment_status === 'unpaid');
            return NextResponse.json(unpaid);
        }

        // Authenticate - return error if not logged in
        const authResult = await authenticate();
        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('subscriptions')
            .select(`
        *,
        subscriber:subscribers(id, name, email, phone),
        plan:plans(id, name, price)
      `)
            .eq('organization_id', authResult.context.organizationId)
            .eq('payment_status', 'unpaid')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json(
                { error: 'Query failed', message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Unpaid list error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// POST /api/unpaid - Mark subscription as paid
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const { subscription_id, amount, method = 'cash', reference, notes } = await request.json();

        if (!subscription_id) {
            return NextResponse.json(
                { error: 'Missing field', message: 'subscription_id is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        // Get subscription details
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('id, price, payment_status')
            .eq('id', subscription_id)
            .eq('organization_id', orgId)
            .single();

        if (subError || !subscription) {
            return NextResponse.json(
                { error: 'Not found', message: 'Subscription not found' },
                { status: 404 }
            );
        }

        const paymentAmount = amount || subscription.price;

        // Create payment record
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                organization_id: orgId,
                subscription_id,
                amount: paymentAmount,
                method,
                reference: reference || null,
                notes: notes || null,
            })
            .select()
            .single();

        if (paymentError) {
            return NextResponse.json(
                { error: 'Payment creation failed', message: paymentError.message },
                { status: 500 }
            );
        }

        // Update subscription payment status
        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ payment_status: 'paid' })
            .eq('id', subscription_id);

        if (updateError) {
            return NextResponse.json(
                { error: 'Update failed', message: updateError.message },
                { status: 500 }
            );
        }

        // Log activity
        await logActivity({
            userId: authResult.context.userId,
            organizationId: orgId,
            action: ActivityActions.SUBSCRIPTION_MARKED_PAID,
            entityType: 'subscription',
            entityId: subscription_id,
            details: { amount: paymentAmount, method },
        });

        return NextResponse.json({
            success: true,
            payment,
            message: 'Subscription marked as paid',
        });
    } catch (error) {
        console.error('Mark paid error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
