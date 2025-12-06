import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticate } from '@/lib/supabase/middleware';

export async function GET() {
    try {
        const authResult = await authenticate();

        if (!authResult.success) {
            return authResult.error;
        }

        const supabase = await createClient();

        // Get organization details
        const { data: org } = await supabase
            .from('organizations')
            .select('name, is_active')
            .eq('id', authResult.context.organizationId)
            .single();

        return NextResponse.json({
            user: {
                id: authResult.context.userId,
                email: authResult.context.email,
                role: authResult.context.role,
            },
            organization: org ? {
                id: authResult.context.organizationId,
                name: org.name,
                isActive: org.is_active,
            } : null,
        });
    } catch (error) {
        console.error('Session error:', error);
        return NextResponse.json(
            { error: 'Server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
