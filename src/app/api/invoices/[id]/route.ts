import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';
import { logActivity, ActivityActions } from '@/lib/utils/activity-logger';
import type { UpdateInvoiceInput } from '@/lib/types/database';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/invoices/[id] - Get invoice details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('invoices')
            .select(`
        *,
        subscription:subscriptions(
          id,
          price,
          start_date,
          end_date,
          subscriber:subscribers(id, name, email, phone, address),
          plan:plans(id, name, price)
        )
      `)
            .eq('id', id)
            .eq('organization_id', authResult.context.organizationId)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: 'Not found', message: 'Invoice not found' },
                { status: 404 }
            );
        }

        // Get payments for this invoice
        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('invoice_id', id)
            .order('created_at', { ascending: false });

        return NextResponse.json({
            ...data,
            payments: payments || [],
        });
    } catch (error) {
        console.error('Invoice fetch error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const body: UpdateInvoiceInput = await request.json();
        const supabase = await createClient();
        const orgId = authResult.context.organizationId;

        // Check if invoice exists
        const { data: existing } = await supabase
            .from('invoices')
            .select('id, status')
            .eq('id', id)
            .eq('organization_id', orgId)
            .single();

        if (!existing) {
            return NextResponse.json(
                { error: 'Not found', message: 'Invoice not found' },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (body.status !== undefined) updateData.status = body.status;
        if (body.paid_date !== undefined) updateData.paid_date = body.paid_date;
        if (body.notes !== undefined) updateData.notes = body.notes;

        const { data, error } = await supabase
            .from('invoices')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: 'Update failed', message: error.message },
                { status: 500 }
            );
        }

        // Log activity if status changed to paid
        if (body.status === 'paid' && existing.status !== 'paid') {
            await logActivity({
                userId: authResult.context.userId,
                organizationId: orgId,
                action: ActivityActions.INVOICE_PAID,
                entityType: 'invoice',
                entityId: id,
            });
        } else {
            await logActivity({
                userId: authResult.context.userId,
                organizationId: orgId,
                action: ActivityActions.INVOICE_UPDATED,
                entityType: 'invoice',
                entityId: id,
                details: updateData,
            });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Invoice update error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
