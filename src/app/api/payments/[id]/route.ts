import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/payments/[id] - Get payment details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('payments')
            .select(`
        *,
        invoice:invoices(
          id,
          invoice_number,
          amount,
          status,
          due_date
        ),
        subscription:subscriptions(
          id,
          price,
          start_date,
          end_date,
          status,
          subscriber:subscribers(id, name, email, phone),
          plan:plans(id, name)
        )
      `)
            .eq('id', id)
            .eq('organization_id', authResult.context.organizationId)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: 'Not found', message: 'Payment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Payment fetch error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
