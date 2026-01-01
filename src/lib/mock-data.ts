// Mock data for testing without Supabase connection

export const mockSubscribers = [
    { id: '1', name: 'أحمد محمد', email: 'ahmed@example.com', phone: '+964 770 123 4567', is_active: true, created_at: '2024-01-15T10:00:00Z' },
    { id: '2', name: 'سارة علي', email: 'sara@example.com', phone: '+964 771 234 5678', is_active: true, created_at: '2024-02-20T14:30:00Z' },
    { id: '3', name: 'محمد حسن', email: 'mohammed@example.com', phone: '+964 772 345 6789', is_active: true, created_at: '2024-03-10T09:15:00Z' },
    { id: '4', name: 'فاطمة كريم', email: 'fatima@example.com', phone: '+964 773 456 7890', is_active: false, created_at: '2024-04-05T11:45:00Z' },
    { id: '5', name: 'علي عباس', email: 'ali@example.com', phone: '+964 774 567 8901', is_active: true, created_at: '2024-05-12T16:20:00Z' },
    { id: '6', name: 'نور الدين', email: 'noor@example.com', phone: '+964 775 678 9012', is_active: true, created_at: '2024-06-08T08:00:00Z' },
    { id: '7', name: 'زينب حسين', email: 'zainab@example.com', phone: '+964 776 789 0123', is_active: true, created_at: '2024-07-22T13:10:00Z' },
    { id: '8', name: 'كريم صالح', email: 'kareem@example.com', phone: '+964 777 890 1234', is_active: true, created_at: '2024-08-30T10:30:00Z' },
];

export const mockPlans = [
    { id: '1', name: 'أساسي شهري', description: 'الخطة الأساسية الشهرية', price: 25000, period_value: 1, period_unit: 'month', is_active: true },
    { id: '2', name: 'متقدم شهري', description: 'الخطة المتقدمة الشهرية', price: 50000, period_value: 1, period_unit: 'month', is_active: true },
    { id: '3', name: 'أساسي سنوي', description: 'الخطة الأساسية السنوية', price: 250000, period_value: 1, period_unit: 'year', is_active: true },
    { id: '4', name: 'متقدم سنوي', description: 'الخطة المتقدمة السنوية', price: 500000, period_value: 1, period_unit: 'year', is_active: true },
    { id: '5', name: 'أسبوعي', description: 'اشتراك أسبوعي', price: 10000, period_value: 1, period_unit: 'week', is_active: true },
];

// Generate dates relative to today
const today = new Date();
const addDays = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

export const mockSubscriptions = [
    { id: '1', subscriber_id: '1', plan_id: '1', price: 25000, status: 'active', payment_status: 'paid', start_date: addDays(-30), end_date: addDays(0), subscriber: mockSubscribers[0], plan: mockPlans[0], renewal_count: 1, notes: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
    { id: '2', subscriber_id: '2', plan_id: '2', price: 50000, status: 'active', payment_status: 'paid', start_date: addDays(-25), end_date: addDays(5), subscriber: mockSubscribers[1], plan: mockPlans[1], renewal_count: 1, notes: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString() },
    { id: '3', subscriber_id: '3', plan_id: '1', price: 25000, status: 'active', payment_status: 'unpaid', start_date: addDays(-20), end_date: addDays(10), subscriber: mockSubscribers[2], plan: mockPlans[0], renewal_count: 1, notes: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString() },
    { id: '4', subscriber_id: '4', plan_id: '3', price: 250000, status: 'expired', payment_status: 'paid', start_date: addDays(-400), end_date: addDays(-35), subscriber: mockSubscribers[3], plan: mockPlans[2], renewal_count: 1, notes: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString() },
    { id: '5', subscriber_id: '5', plan_id: '2', price: 50000, status: 'active', payment_status: 'unpaid', start_date: addDays(-15), end_date: addDays(15), subscriber: mockSubscribers[4], plan: mockPlans[1], renewal_count: 1, notes: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString() },
    { id: '6', subscriber_id: '6', plan_id: '4', price: 500000, status: 'active', payment_status: 'paid', start_date: addDays(-100), end_date: addDays(265), subscriber: mockSubscribers[5], plan: mockPlans[3], renewal_count: 1, notes: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString() },
    { id: '7', subscriber_id: '7', plan_id: '1', price: 25000, status: 'active', payment_status: 'paid', start_date: addDays(-10), end_date: addDays(20), subscriber: mockSubscribers[6], plan: mockPlans[0], renewal_count: 1, notes: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
    { id: '8', subscriber_id: '8', plan_id: '5', price: 10000, status: 'active', payment_status: 'unpaid', start_date: addDays(-5), end_date: addDays(2), subscriber: mockSubscribers[7], plan: mockPlans[4], renewal_count: 1, notes: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
];

export const mockActivity = [
    { id: '1', action: 'subscription.created', entity_type: 'subscription', entity_id: '8', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), user: { email: 'admin@example.com' } },
    { id: '2', action: 'subscriber.created', entity_type: 'subscriber', entity_id: '8', created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), user: { email: 'admin@example.com' } },
    { id: '3', action: 'subscription.marked_paid', entity_type: 'subscription', entity_id: '7', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), user: { email: 'admin@example.com' } },
    { id: '4', action: 'payment.recorded', entity_type: 'payment', entity_id: '5', created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), user: { email: 'admin@example.com' } },
    { id: '5', action: 'plan.created', entity_type: 'plan', entity_id: '5', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), user: { email: 'admin@example.com' } },
    { id: '6', action: 'subscriber.created', entity_type: 'subscriber', entity_id: '7', created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), user: { email: 'admin@example.com' } },
    { id: '7', action: 'user.login', entity_type: 'user', entity_id: '1', created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), user: { email: 'admin@example.com' } },
];

export const mockOrganization = {
    id: 'org-1',
    name: 'شركة العراق للتقنية',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
};

export const mockDashboardStats = {
    totalSubscribers: mockSubscribers.length,
    activeSubscriptions: mockSubscriptions.filter(s => s.status === 'active').length,
    monthlyRevenue: mockSubscriptions
        .filter(s => s.status === 'active' && s.payment_status === 'paid')
        .reduce((sum, s) => sum + s.price, 0),
    unpaidCount: mockSubscriptions.filter(s => s.payment_status === 'unpaid').length,
    expiringSubscriptions: mockSubscriptions
        .filter(s => {
            const daysLeft = Math.ceil((new Date(s.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return s.status === 'active' && daysLeft >= 0 && daysLeft <= 7;
        })
        .slice(0, 5),
};

// Check if we should use mock data
export const isMockMode = () => {
    // Check if running on client side
    if (typeof window !== 'undefined') {
        // If user logged in with real credentials, don't use mock mode
        const authMode = localStorage.getItem('authMode');
        if (authMode === 'real') {
            return false;
        }
        // If user chose demo mode explicitly
        if (authMode === 'demo') {
            return true;
        }
    }

    // Force demo mode with environment variable (only if no authMode set)
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return true;
    }

    // No Supabase configured = mock mode
    return !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_project_url';
};

// Server-side mock mode check (doesn't have access to localStorage)
export const isServerMockMode = () => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return true;
    }
    return !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_project_url';
};

