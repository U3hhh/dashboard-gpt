import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { getPaginationParams, createPaginatedResponse, getSupabaseRange } from '@/lib/utils/pagination';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';
import type { CreateInvoiceInput } from '@/lib/types/database';

// GET /api/invoices - List invoices with pagination and filtering
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
        const status = searchParams.get('status');
        const subscriptionId = searchParams.get('subscription_id');

        // Build query
        let query = supabase
            .from('invoices')
            .select(`
        *,
        subscription:subscriptions(
          id,
          subscriber:subscribers(id, name, email)
        )
      `, { count: 'exact' })
            .eq('organization_id', authResult.context.organizationId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
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
        console.error('Invoices list error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const body: CreateInvoiceInput = await request.json();

        if (!body.subscription_id || !body.invoice_number || body.amount === undefined) {
            return NextResponse.json(
                { error: 'Missing fields', message: 'subscription_id, invoice_number, and amount are required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        // Verify subscription belongs to organization
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('id', body.subscription_id)
            .eq('organization_id', orgId)
            .single();

        if (!subscription) {
            return NextResponse.json(
                { error: 'Not found', message: 'Subscription not found' },
                { status: 404 }
            );
        }

        const { data, error } = await supabase
            .from('invoices')
            .insert({
                organization_id: orgId,
                subscription_id: body.subscription_id,
                invoice_number: body.invoice_number,
                amount: body.amount,
                due_date: body.due_date || null,
                notes: body.notes || null,
                status: 'draft',
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
            action: ActivityActions.INVOICE_CREATED,
            entityType: 'invoice',
            entityId: data.id,
            details: { invoice_number: body.invoice_number, amount: body.amount },
        });

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Invoice creation error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
