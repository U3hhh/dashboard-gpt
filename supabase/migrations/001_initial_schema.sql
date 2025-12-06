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
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
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
