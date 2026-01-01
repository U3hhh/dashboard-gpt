import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'Invalid email or password. Please check your credentials and try again.',
                    code: 'invalid_credentials'
                },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Login error:', error);

            // Map Supabase error codes to user-friendly messages
            let message = 'A server error occurred while logging in. Try again later. If the issue continues, contact support.';
            let code = 'server_error';

            // Supabase error mapping
            const errorMessage = error.message.toLowerCase();

            if (errorMessage.includes('invalid login credentials')) {
                message = 'Invalid email or password. Please check your credentials and try again.';
                code = 'invalid_credentials';
            } else if (errorMessage.includes('email not confirmed')) {
                message = 'Your email is not verified. Check your inbox for the verification message.';
                code = 'email_not_verified';
            } else if (errorMessage.includes('too many requests')) {
                message = 'Your account is locked due to too many failed attempts. Try again later or reset your password.';
                code = 'account_locked';
            } else if (errorMessage.includes('user not found')) {
                // Note: Supabase often returns "Invalid login credentials" for security, 
                // but if we do get a specific "User not found" error (e.g. from admin API or specific config), handle it.
                message = 'No account found with this email. Double-check the email or create a new account.';
                code = 'account_not_found';
            } else if (errorMessage.includes('network')) {
                message = 'Network connection failed. Please check your internet connection and try again.';
                code = 'network_error';
            }

            return NextResponse.json(
                {
                    status: 'error',
                    message,
                    code
                },
                { status: 401 }
            );
        }

        if (!data.user) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'A server error occurred while logging in. Try again later. If the issue continues, contact support.',
                    code: 'server_error'
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            status: 'success',
            message: 'Welcome back — loading your private dashboard...',
            redirect: 'dashboard',
            user: {
                id: data.user.id,
                email: data.user.email,
            }
        });

    } catch (error) {
        console.error('Server error during login:', error);

        return NextResponse.json(
            {
                status: 'error',
                message: 'A server error occurred while logging in. Try again later. If the issue continues, contact support.',
                code: 'server_error'
            },
            { status: 500 }
        );
    }
}
