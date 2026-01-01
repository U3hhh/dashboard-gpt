-- Subscription Admin Dashboard - Initial Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- Roles: admin, head_of_project, member
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'member', -- admin, head_of_project, member
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    period_value INTEGER NOT NULL DEFAULT 1,
    period_unit VARCHAR(20) NOT NULL DEFAULT 'month', -- day, week, month, year
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');
CREATE TYPE payment_status AS ENUM ('paid', 'unpaid', 'partial');

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    status subscription_status DEFAULT 'active',
    payment_status payment_status DEFAULT 'unpaid',
    price DECIMAL(12, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status invoice_status DEFAULT 'draft',
    due_date DATE,
    paid_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'bank_transfer', 'paypal');

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    method payment_method NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GROUPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GROUP_SUBSCRIBERS JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS group_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, subscriber_id)
);

-- ============================================
-- ACTIVITY_LOGS TABLE
-- ============================================
CREATE TYPE entity_type AS ENUM ('user', 'subscriber', 'subscription', 'invoice', 'payment', 'plan', 'group', 'organization');

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type entity_type NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ERROR_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    stack TEXT,
    url VARCHAR(500),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_subscribers_org ON subscribers(organization_id);
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_payment_status ON subscriptions(payment_status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_plans_org ON plans(organization_id);
CREATE INDEX idx_groups_org ON groups(organization_id);
CREATE INDEX idx_group_subscribers_group ON group_subscribers(group_id);
CREATE INDEX idx_group_subscribers_subscriber ON group_subscribers(subscriber_id);
CREATE INDEX idx_activity_logs_org ON activity_logs(organization_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_error_logs_org ON error_logs(organization_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (id = get_user_organization_id());

CREATE POLICY "Users can update own organization" ON organizations
    FOR UPDATE USING (id = get_user_organization_id());

-- Users: Can only see users in same organization
CREATE POLICY "Users can view org members" ON users
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert self" ON users
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update self" ON users
    FOR UPDATE USING (id = auth.uid());

-- Subscribers: Organization-scoped access
CREATE POLICY "Org members can view subscribers" ON subscribers
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Org members can insert subscribers" ON subscribers
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org members can update subscribers" ON subscribers
    FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "Org members can delete subscribers" ON subscribers
    FOR DELETE USING (organization_id = get_user_organization_id());

-- Plans: Organization-scoped access
CREATE POLICY "Org members can view plans" ON plans
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Org members can insert plans" ON plans
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org members can update plans" ON plans
    FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "Org members can delete plans" ON plans
    FOR DELETE USING (organization_id = get_user_organization_id());

-- Subscriptions: Organization-scoped access
CREATE POLICY "Org members can view subscriptions" ON subscriptions
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Org members can insert subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org members can update subscriptions" ON subscriptions
    FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "Org members can delete subscriptions" ON subscriptions
    FOR DELETE USING (organization_id = get_user_organization_id());

-- Invoices: Organization-scoped access
CREATE POLICY "Org members can view invoices" ON invoices
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Org members can insert invoices" ON invoices
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org members can update invoices" ON invoices
    FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "Org members can delete invoices" ON invoices
    FOR DELETE USING (organization_id = get_user_organization_id());

-- Payments: Organization-scoped access
CREATE POLICY "Org members can view payments" ON payments
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Org members can insert payments" ON payments
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org members can update payments" ON payments
    FOR UPDATE USING (organization_id = get_user_organization_id());

-- Groups: Organization-scoped access
CREATE POLICY "Org members can view groups" ON groups
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Org members can insert groups" ON groups
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org members can update groups" ON groups
    FOR UPDATE USING (organization_id = get_user_organization_id());

CREATE POLICY "Org members can delete groups" ON groups
    FOR DELETE USING (organization_id = get_user_organization_id());

-- Group subscribers: Access through group's organization
CREATE POLICY "Org members can view group_subscribers" ON group_subscribers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM groups g 
            WHERE g.id = group_subscribers.group_id 
            AND g.organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Org members can insert group_subscribers" ON group_subscribers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups g 
            WHERE g.id = group_subscribers.group_id 
            AND g.organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Org members can delete group_subscribers" ON group_subscribers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM groups g 
            WHERE g.id = group_subscribers.group_id 
            AND g.organization_id = get_user_organization_id()
        )
    );

-- Activity logs: Organization-scoped access
CREATE POLICY "Org members can view activity_logs" ON activity_logs
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Org members can insert activity_logs" ON activity_logs
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

-- Error logs: Organization-scoped access
CREATE POLICY "Org members can view error_logs" ON error_logs
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Org members can insert error_logs" ON error_logs
    FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org members can delete error_logs" ON error_logs
    FOR DELETE USING (organization_id = get_user_organization_id());

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON subscribers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-EXPIRE SUBSCRIPTIONS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION auto_expire_subscriptions()
RETURNS void AS $$
BEGIN
    UPDATE subscriptions
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' 
    AND end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GENERATE INVOICE NUMBER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION generate_invoice_number(org_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    next_num INTEGER;
    year_str VARCHAR(4);
BEGIN
    year_str := TO_CHAR(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM 'INV-[0-9]{4}-([0-9]+)') AS INTEGER)
    ), 0) + 1 INTO next_num
    FROM invoices
    WHERE organization_id = org_id
    AND invoice_number LIKE 'INV-' || year_str || '-%';
    
    RETURN 'INV-' || year_str || '-' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CREATE INVOICE FOR SUBSCRIPTION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION create_subscription_invoice(sub_id UUID)
RETURNS UUID AS $$
DECLARE
    sub_record RECORD;
    new_invoice_id UUID;
BEGIN
    SELECT s.*, o.id as org_id 
    INTO sub_record
    FROM subscriptions s
    JOIN organizations o ON s.organization_id = o.id
    WHERE s.id = sub_id;
    
    IF sub_record IS NULL THEN
        RETURN NULL;
    END IF;
    
    INSERT INTO invoices (
        organization_id,
        subscription_id,
        invoice_number,
        amount,
        status,
        due_date
    ) VALUES (
        sub_record.organization_id,
        sub_id,
        generate_invoice_number(sub_record.organization_id),
        sub_record.price,
        'sent',
        sub_record.start_date + INTERVAL '7 days'
    ) RETURNING id INTO new_invoice_id;
    
    RETURN new_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA FOR TESTING
-- ============================================

-- Create a test organization
INSERT INTO organizations (id, name, is_active) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'شركة العراق للتقنية', true)
ON CONFLICT (id) DO NOTHING;

-- Create test plans
INSERT INTO plans (organization_id, name, description, price, period_value, period_unit) VALUES
    ('00000000-0000-0000-0000-000000000001', 'أساسي شهري', 'الخطة الأساسية الشهرية', 25000, 1, 'month'),
    ('00000000-0000-0000-0000-000000000001', 'متقدم شهري', 'الخطة المتقدمة الشهرية', 50000, 1, 'month'),
    ('00000000-0000-0000-0000-000000000001', 'أساسي سنوي', 'الخطة الأساسية السنوية', 250000, 1, 'year'),
    ('00000000-0000-0000-0000-000000000001', 'متقدم سنوي', 'الخطة المتقدمة السنوية', 500000, 1, 'year'),
    ('00000000-0000-0000-0000-000000000001', 'أسبوعي', 'اشتراك أسبوعي', 10000, 1, 'week')
ON CONFLICT DO NOTHING;

-- Create test subscribers
INSERT INTO subscribers (organization_id, name, email, phone, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'أحمد محمد', 'ahmed@example.com', '+964 770 123 4567', true),
    ('00000000-0000-0000-0000-000000000001', 'سارة علي', 'sara@example.com', '+964 771 234 5678', true),
    ('00000000-0000-0000-0000-000000000001', 'محمد حسن', 'mohammed@example.com', '+964 772 345 6789', true),
    ('00000000-0000-0000-0000-000000000001', 'فاطمة كريم', 'fatima@example.com', '+964 773 456 7890', true),
    ('00000000-0000-0000-0000-000000000001', 'علي عباس', 'ali@example.com', '+964 774 567 8901', true),
    ('00000000-0000-0000-0000-000000000001', 'نور الدين', 'noor@example.com', '+964 775 678 9012', true),
    ('00000000-0000-0000-0000-000000000001', 'زينب حسين', 'zainab@example.com', '+964 776 789 0123', true),
    ('00000000-0000-0000-0000-000000000001', 'كريم صالح', 'kareem@example.com', '+964 777 890 1234', true)
ON CONFLICT DO NOTHING;

-- Create test groups
INSERT INTO groups (organization_id, name, description, color) VALUES
    ('00000000-0000-0000-0000-000000000001', 'عملاء VIP', 'العملاء المميزين', '#8b5cf6'),
    ('00000000-0000-0000-0000-000000000001', 'الشركات', 'حسابات الشركات', '#06b6d4'),
    ('00000000-0000-0000-0000-000000000001', 'الأفراد', 'الحسابات الفردية', '#10b981')
ON CONFLICT DO NOTHING;

-- ============================================
-- HELPER VIEW: SUBSCRIPTION SUMMARY
-- ============================================
CREATE OR REPLACE VIEW subscription_summary AS
SELECT 
    s.id,
    s.organization_id,
    sub.name as subscriber_name,
    sub.email as subscriber_email,
    sub.phone as subscriber_phone,
    p.name as plan_name,
    s.status,
    s.payment_status,
    s.price,
    s.start_date,
    s.end_date,
    s.end_date - CURRENT_DATE as days_until_expiry,
    CASE 
        WHEN s.end_date < CURRENT_DATE THEN 'expired'
        WHEN s.end_date <= CURRENT_DATE + 7 THEN 'expiring_soon'
        ELSE 'ok'
    END as expiry_status
FROM subscriptions s
LEFT JOIN subscribers sub ON s.subscriber_id = sub.id
LEFT JOIN plans p ON s.plan_id = p.id;

-- ============================================
-- HELPER VIEW: MONTHLY REVENUE
-- ============================================
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
    organization_id,
    DATE_TRUNC('month', paid_at) as month,
    COUNT(*) as payment_count,
    SUM(amount) as total_revenue
FROM payments
GROUP BY organization_id, DATE_TRUNC('month', paid_at)
ORDER BY month DESC;

-- ============================================
-- CRON JOB SETUP (run in Supabase dashboard > SQL Editor)
-- Uncomment to enable auto-expiration daily at midnight
-- ============================================
-- SELECT cron.schedule(
--     'auto-expire-subscriptions',
--     '0 0 * * *',
--     $$SELECT auto_expire_subscriptions()$$
-- );

-- ============================================
-- GRANT PERMISSIONS (for Supabase)
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
