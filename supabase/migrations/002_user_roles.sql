-- ============================================
-- Migration: 002_user_roles.sql
-- Description: Add user management with roles
-- Created: 2024-12-06
-- ============================================

-- Add name and is_active columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(255);
    END IF;

    -- Add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Update role column to support new roles
-- Roles: admin, head_of_project, member
COMMENT ON COLUMN users.role IS 'User role: admin (full access), head_of_project (manage users & subscriptions), member (view only)';

-- ============================================
-- ROLE-BASED ACCESS CONTROL FUNCTIONS
-- ============================================

-- Function to check if user has admin role
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id AND role = 'admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage users (admin or head_of_project)
CREATE OR REPLACE FUNCTION can_manage_users(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND role IN ('admin', 'head_of_project') 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage subscriptions
CREATE OR REPLACE FUNCTION can_manage_subscriptions(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND role IN ('admin', 'head_of_project', 'member') 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES FOR USER MANAGEMENT
-- ============================================

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view users in same org" ON users;
DROP POLICY IF EXISTS "Admins and Head of Project can insert users" ON users;
DROP POLICY IF EXISTS "Admins and Head of Project can update users" ON users;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view other users in same organization
CREATE POLICY "Users can view users in same org" ON users
    FOR SELECT
    USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Policy: Only admin and head_of_project can insert new users
CREATE POLICY "Admins and Head of Project can insert users" ON users
    FOR INSERT
    WITH CHECK (
        can_manage_users(auth.uid())
        AND organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Policy: Only admin and head_of_project can update users
CREATE POLICY "Admins and Head of Project can update users" ON users
    FOR UPDATE
    USING (
        can_manage_users(auth.uid())
        AND organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        can_manage_users(auth.uid())
        AND organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- ============================================
-- SEED DATA: Sample Users (for testing)
-- ============================================

-- Note: These users require corresponding auth.users entries
-- You can create them via Supabase Dashboard > Authentication > Users

-- Example insert (uncomment and modify after creating auth users):
/*
INSERT INTO users (id, organization_id, email, name, role, is_active) VALUES
    ('YOUR_AUTH_USER_UUID_1', 'YOUR_ORG_UUID', 'admin@example.com', 'أحمد المدير', 'admin', true),
    ('YOUR_AUTH_USER_UUID_2', 'YOUR_ORG_UUID', 'manager@example.com', 'سارة رئيسة المشروع', 'head_of_project', true),
    ('YOUR_AUTH_USER_UUID_3', 'YOUR_ORG_UUID', 'member@example.com', 'محمد عضو', 'member', true)
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_users(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_subscriptions(UUID) TO authenticated;
