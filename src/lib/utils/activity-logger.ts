import { createClient } from '../supabase/server';
import type { EntityType } from '../types/database';

export interface LogActivityOptions {
    userId: string;
    organizationId: string;
    action: string;
    entityType: EntityType;
    entityId?: string;
    details?: Record<string, unknown>;
}

/**
 * Log an activity to the activity_logs table
 * @param options - Activity log options
 */
export async function logActivity(options: LogActivityOptions): Promise<void> {
    try {
        const supabase = await createClient();

        await supabase.from('activity_logs').insert({
            user_id: options.userId,
            organization_id: options.organizationId,
            action: options.action,
            entity_type: options.entityType,
            entity_id: options.entityId || null,
            details: options.details || null,
        });
    } catch (error) {
        // Log to console but don't throw - activity logging shouldn't break the main operation
        console.error('Failed to log activity:', error);
    }
}

/**
 * Pre-defined action types for consistency
 */
export const ActivityActions = {
    // Subscriber actions
    SUBSCRIBER_CREATED: 'subscriber.created',
    SUBSCRIBER_UPDATED: 'subscriber.updated',
    SUBSCRIBER_DELETED: 'subscriber.deleted',

    // Subscription actions
    SUBSCRIPTION_CREATED: 'subscription.created',
    SUBSCRIPTION_UPDATED: 'subscription.updated',
    SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
    SUBSCRIPTION_RENEWED: 'subscription.renewed',
    SUBSCRIPTION_MARKED_PAID: 'subscription.marked_paid',

    // Plan actions
    PLAN_CREATED: 'plan.created',
    PLAN_UPDATED: 'plan.updated',
    PLAN_DELETED: 'plan.deleted',

    // Invoice actions
    INVOICE_CREATED: 'invoice.created',
    INVOICE_UPDATED: 'invoice.updated',
    INVOICE_PAID: 'invoice.paid',

    // Payment actions
    PAYMENT_RECORDED: 'payment.recorded',

    // Group actions
    GROUP_CREATED: 'group.created',
    GROUP_UPDATED: 'group.updated',
    GROUP_DELETED: 'group.deleted',
    GROUP_MEMBER_ADDED: 'group.member_added',
    GROUP_MEMBER_REMOVED: 'group.member_removed',

    // Organization actions
    ORGANIZATION_UPDATED: 'organization.updated',

    // User actions
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',
    USER_PASSWORD_CHANGED: 'user.password_changed',
} as const;

export type ActivityAction = typeof ActivityActions[keyof typeof ActivityActions];
