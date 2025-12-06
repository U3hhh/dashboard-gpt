# Subscription Admin Dashboard - Environment Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Getting Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select an existing one
3. Go to Project Settings > API
4. Copy the **Project URL** and **anon public** key
5. Paste them into your `.env.local` file

## Database Setup

1. Go to your Supabase project's SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Run the SQL to create all tables and RLS policies
