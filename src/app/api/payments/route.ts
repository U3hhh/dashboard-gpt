import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { getPaginationParams, createPaginatedResponse, getSupabaseRange } from '@/lib/utils/pagination';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';
import type { CreatePaymentInput } from '@/lib/types/database';

// GET /api/payments - List payments with pagination
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const paginationParams = getPaginationParams(searchParams);
        const { from, to } = getSupabaseRange(paginationParams);

        // Filter options
        const method = searchParams.get('method');
        const invoiceId = searchParams.get('invoice_id');
        const subscriptionId = searchParams.get('subscription_id');

        // Build query
        let query = supabase
            .from('payments')
            .select(`
        *,
        invoice:invoices(id, invoice_number, status),
        subscription:subscriptions(
          id,
          subscriber:subscribers(id, name)
        )
      `, { count: 'exact' })
            .eq('organization_id', authResult.context.organizationId)
            .order('paid_at', { ascending: false });

        if (method) {
            query = query.eq('method', method);
        }
        if (invoiceId) {
            query = query.eq('invoice_id', invoiceId);
        }
        if (subscriptionId) {
            query = query.eq('subscription_id', subscriptionId);
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            return NextResponse.json(
                { error: 'Query failed', message: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            createPaginatedResponse(data || [], count || 0, paginationParams.page, paginationParams.limit)
        );
    } catch (error) {
        console.error('Payments list error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// POST /api/payments - Record a new payment
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const body: CreatePaymentInput = await request.json();

        if (body.amount === undefined || !body.method) {
            return NextResponse.json(
                { error: 'Missing fields', message: 'amount and method are required' },
                { status: 400 }
            );
        }

        const validMethods = ['cash', 'card', 'bank_transfer', 'paypal'];
        if (!validMethods.includes(body.method)) {
            return NextResponse.json(
                { error: 'Invalid method', message: 'method must be one of: cash, card, bank_transfer, paypal' },
                { status: 400 }
            );
        }

        if (!body.invoice_id && !body.subscription_id) {
            return NextResponse.json(
                { error: 'Missing reference', message: 'Either invoice_id or subscription_id is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        const { data, error } = await supabase
            .from('payments')
            .insert({
                organization_id: orgId,
                invoice_id: body.invoice_id || null,
                subscription_id: body.subscription_id || null,
                amount: body.amount,
                method: body.method,
                reference: body.reference || null,
                notes: body.notes || null,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: 'Creation failed', message: error.message },
                { status: 500 }
            );
        }

        // Log activity
        await logActivity({
            userId: authResult.context.userId,
            organizationId: orgId,
            action: ActivityActions.PAYMENT_RECORDED,
            entityType: 'payment',
            entityId: data.id,
            details: { amount: body.amount, method: body.method },
        });

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Payment creation error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
