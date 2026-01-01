// Database entity types

export interface Organization {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    organization_id: string;
    email: string;
    role: 'admin' | 'user';
    created_at: string;
    updated_at: string;
}

export interface Subscriber {
    id: string;
    organization_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Plan {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    price: number;
    period_value: number;
    period_unit: 'day' | 'week' | 'month' | 'year';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type PaymentStatusType = 'paid' | 'unpaid' | 'partial';

export interface Subscription {
    id: string;
    organization_id: string;
    subscriber_id: string;
    plan_id: string | null;
    status: SubscriptionStatus;
    payment_status: PaymentStatusType;
    price: number;
    start_date: string;
    end_date: string;
    notes: string | null;
    renewal_count: number;
    created_at: string;
    updated_at: string;
}

export interface SubscriptionWithDetails extends Subscription {
    subscriber?: Subscriber;
    plan?: Plan;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
    id: string;
    organization_id: string;
    subscription_id: string;
    invoice_number: string;
    amount: number;
    status: InvoiceStatus;
    due_date: string | null;
    paid_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface InvoiceWithDetails extends Invoice {
    subscription?: SubscriptionWithDetails;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'paypal';

export interface Payment {
    id: string;
    organization_id: string;
    invoice_id: string | null;
    subscription_id: string | null;
    amount: number;
    method: PaymentMethod;
    reference: string | null;
    notes: string | null;
    paid_at: string;
    created_at: string;
}

export interface PaymentWithDetails extends Payment {
    invoice?: Invoice;
    subscription?: SubscriptionWithDetails;
}

export interface Group {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    color: string | null;
    created_at: string;
    updated_at: string;
}

export interface GroupWithMembers extends Group {
    members?: Subscriber[];
    member_count?: number;
}

export interface GroupSubscriber {
    id: string;
    group_id: string;
    subscriber_id: string;
    created_at: string;
}

export type EntityType = 'user' | 'subscriber' | 'subscription' | 'invoice' | 'payment' | 'plan' | 'group' | 'organization';

export interface ActivityLog {
    id: string;
    organization_id: string;
    user_id: string | null;
    action: string;
    entity_type: EntityType;
    entity_id: string | null;
    details: Record<string, unknown> | null;
    created_at: string;
}

export interface ActivityLogWithUser extends ActivityLog {
    user?: User;
}

export interface ErrorLog {
    id: string;
    organization_id: string;
    user_id: string | null;
    message: string;
    stack: string | null;
    url: string | null;
    user_agent: string | null;
    created_at: string;
}

// API Request/Response types

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ApiError {
    error: string;
    message: string;
}

export interface DashboardStats {
    totalSubscribers: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    unpaidCount: number;
    expiringSubscriptions: SubscriptionWithDetails[];
}

export interface AnalyticsData {
    revenue: {
        labels: string[];
        data: number[];
    };
    subscriptions: {
        active: number;
        expired: number;
        cancelled: number;
        pending: number;
    };
    subscribers: {
        total: number;
        active: number;
        inactive: number;
    };
    trends: {
        date: string;
        revenue: number;
        subscriptions: number;
        subscribers: number;
    }[];
}

// Form/Input types

export interface CreateSubscriberInput {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
}

export interface UpdateSubscriberInput extends Partial<CreateSubscriberInput> {
    is_active?: boolean;
}

export interface CreatePlanInput {
    name: string;
    description?: string;
    price: number;
    period_value: number;
    period_unit: 'day' | 'week' | 'month' | 'year';
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {
    is_active?: boolean;
}

export interface CreateSubscriptionInput {
    subscriber_id: string;
    plan_id?: string;
    price: number;
    start_date: string;
    end_date: string;
    notes?: string;
    status?: SubscriptionStatus;
    payment_status?: PaymentStatusType;
}

export interface UpdateSubscriptionInput {
    status?: SubscriptionStatus;
    payment_status?: PaymentStatusType;
    price?: number;
    end_date?: string;
    notes?: string;
    renewal_count?: number;
}

export interface CreateInvoiceInput {
    subscription_id: string;
    invoice_number: string;
    amount: number;
    due_date?: string;
    notes?: string;
}

export interface UpdateInvoiceInput {
    status?: InvoiceStatus;
    paid_date?: string;
    notes?: string;
}

export interface CreatePaymentInput {
    invoice_id?: string;
    subscription_id?: string;
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
}

export interface CreateGroupInput {
    name: string;
    description?: string;
    color?: string;
}

export interface UpdateGroupInput extends Partial<CreateGroupInput> { }

export interface LogErrorInput {
    message: string;
    stack?: string;
    url?: string;
    user_agent?: string;
}
