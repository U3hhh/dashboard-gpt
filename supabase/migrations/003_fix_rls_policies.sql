-- ============================================
-- Migration: 003_fix_rls_policies.sql
-- Description: Fix RLS policies to allow proper access
-- Created: 2024-12-06
-- Run this AFTER 001_initial_schema.sql
-- ============================================

-- ============================================
-- DISABLE RLS TEMPORARILY FOR SETUP
-- ============================================
ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscribers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs DISABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP ALL EXISTING POLICIES (ignore errors if not exist)
-- ============================================
DROP POLICY IF EXISTS "Users can view users in same org" ON users;
DROP POLICY IF EXISTS "Admins and Head of Project can insert users" ON users;
DROP POLICY IF EXISTS "Admins and Head of Project can update users" ON users;
DROP POLICY IF EXISTS "Organization members can view" ON organizations;
DROP POLICY IF EXISTS "Admins can update organization" ON organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can insert organization (first time setup)" ON organizations;
DROP POLICY IF EXISTS "Admins can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view themselves" ON users;
DROP POLICY IF EXISTS "Users can insert themselves" ON users;
DROP POLICY IF EXISTS "Managers can insert users in their org" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Managers can update users in their org" ON users;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Get user's organization
-- ============================================
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- ORGANIZATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view their organization"
    ON organizations FOR SELECT
    USING (id = get_user_org_id() OR NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert organization (first time setup)"
    ON organizations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can update their organization"
    ON organizations FOR UPDATE
    USING (id = get_user_org_id());

-- ============================================
-- USERS POLICIES
-- ============================================
CREATE POLICY "Users can view themselves and org members"
    ON users FOR SELECT
    USING (id = auth.uid() OR organization_id = get_user_org_id());

CREATE POLICY "Anyone can insert themselves"
    ON users FOR INSERT
    WITH CHECK (id = auth.uid() OR organization_id = get_user_org_id());

CREATE POLICY "Users can update themselves or managers can update org users"
    ON users FOR UPDATE
    USING (id = auth.uid() OR organization_id = get_user_org_id());

-- ============================================
-- SUBSCRIBERS POLICIES
-- ============================================
CREATE POLICY "Users can view subscribers in their org"
    ON subscribers FOR SELECT
    USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert subscribers in their org"
    ON subscribers FOR INSERT
    WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update subscribers in their org"
    ON subscribers FOR UPDATE
    USING (organization_id = get_user_org_id());

CREATE POLICY "Users can delete subscribers in their org"
    ON subscribers FOR DELETE
    USING (organization_id = get_user_org_id());

-- ============================================
-- PLANS POLICIES
-- ============================================
CREATE POLICY "Users can view plans in their org"
    ON plans FOR SELECT
    USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert plans in their org"
    ON plans FOR INSERT
    WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update plans in their org"
    ON plans FOR UPDATE
    USING (organization_id = get_user_org_id());

-- ============================================
-- SUBSCRIPTIONS POLICIES
-- ============================================
CREATE POLICY "Users can view subscriptions in their org"
    ON subscriptions FOR SELECT
    USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert subscriptions in their org"
    ON subscriptions FOR INSERT
    WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update subscriptions in their org"
    ON subscriptions FOR UPDATE
    USING (organization_id = get_user_org_id());

-- ============================================
-- GROUPS POLICIES
-- ============================================
CREATE POLICY "Users can view groups in their org"
    ON groups FOR SELECT
    USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert groups in their org"
    ON groups FOR INSERT
    WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update groups in their org"
    ON groups FOR UPDATE
    USING (organization_id = get_user_org_id());

-- ============================================
-- INVOICES POLICIES
-- ============================================
CREATE POLICY "Users can view invoices in their org"
    ON invoices FOR SELECT
    USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert invoices in their org"
    ON invoices FOR INSERT
    WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update invoices in their org"
    ON invoices FOR UPDATE
    USING (organization_id = get_user_org_id());

-- ============================================
-- PAYMENTS POLICIES
-- ============================================
CREATE POLICY "Users can view payments in their org"
    ON payments FOR SELECT
    USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert payments in their org"
    ON payments FOR INSERT
    WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Users can update payments in their org"
    ON payments FOR UPDATE
    USING (organization_id = get_user_org_id());

-- ============================================
-- ACTIVITY_LOGS POLICIES
-- ============================================
CREATE POLICY "Users can view activity in their org"
    ON activity_logs FOR SELECT
    USING (organization_id = get_user_org_id());

CREATE POLICY "Users can insert activity in their org"
    ON activity_logs FOR INSERT
    WITH CHECK (organization_id = get_user_org_id());

-- ============================================
-- GRANT FUNCTION PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION get_user_org_id() TO authenticated;
