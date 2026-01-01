import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate, isDemoMode } from '@/lib/supabase/middleware';
import { ActivityActions } from '@/lib/utils/activity-logger';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (await isDemoMode()) {
            const { mockActivity, mockSubscriptions } = require('@/lib/mock-data');
            const logIndex = mockActivity.findIndex((l: any) => l.id === id);

            if (logIndex !== -1) {
                const log = mockActivity[logIndex];
                if (log.action === ActivityActions.SUBSCRIPTION_UPDATED && log.entity_type === 'subscription' && log.details?.type === 'renewal') {
                    const subIndex = mockSubscriptions.findIndex((s: any) => s.id === log.entity_id);
                    if (subIndex !== -1 && (mockSubscriptions[subIndex].renewal_count || 0) > 1) {
                        mockSubscriptions[subIndex].renewal_count -= 1;
                    }
                }
                mockActivity.splice(logIndex, 1);
                return NextResponse.json({ success: true });
            }
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const authResult = await authenticate();
        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        // Check if the log exists and belongs to the organization
        const { data: log, error: fetchError } = await supabase
            .from('activity_logs')
            .select('id, organization_id, action, entity_type, entity_id, details')
            .eq('id', id)
            .single();

        if (fetchError || !log) {
            return NextResponse.json(
                { error: 'Not found', message: 'Activity log not found' },
                { status: 404 }
            );
        }

        if (log.organization_id !== (authResult as any).context.organizationId) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'You do not have permission to delete this log' },
                { status: 403 }
            );
        }

        if (log.action === ActivityActions.SUBSCRIPTION_UPDATED && log.entity_type === 'subscription' && log.details?.type === 'renewal') {
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('renewal_count')
                .eq('id', log.entity_id)
                .single();

            if (sub && (sub.renewal_count || 0) > 1) {
                await supabase
                    .from('subscriptions')
                    .update({ renewal_count: sub.renewal_count - 1 })
                    .eq('id', log.entity_id);
            }
        }

        // Delete the log
        const { error: deleteError } = await supabase
            .from('activity_logs')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return NextResponse.json(
                { error: 'Delete failed', message: deleteError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete activity log error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
