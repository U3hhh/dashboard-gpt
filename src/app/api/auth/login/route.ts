import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                {
                    error: 'Validation Error',
                    message: 'Email and password are required',
                    code: 'MISSING_CREDENTIALS'
                },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                {
                    error: 'Validation Error',
                    message: 'Invalid email format',
                    code: 'INVALID_EMAIL'
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
            let message = 'Login failed. Please try again.';
            let code = 'AUTH_ERROR';

            if (error.message.includes('Invalid login credentials')) {
                message = 'Invalid email or password. Please check your credentials.';
                code = 'INVALID_CREDENTIALS';
            } else if (error.message.includes('Email not confirmed')) {
                message = 'Please verify your email address before logging in.';
                code = 'EMAIL_NOT_VERIFIED';
            } else if (error.message.includes('Too many requests')) {
                message = 'Too many login attempts. Please wait a few minutes and try again.';
                code = 'RATE_LIMITED';
            } else if (error.message.includes('User not found')) {
                message = 'No account found with this email. Please sign up first.';
                code = 'USER_NOT_FOUND';
            } else if (error.message.includes('network')) {
                message = 'Network error. Please check your internet connection.';
                code = 'NETWORK_ERROR';
            }

            return NextResponse.json(
                {
                    error: 'Authentication Failed',
                    message,
                    code,
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                },
                { status: 401 }
            );
        }

        if (!data.user) {
            return NextResponse.json(
                {
                    error: 'Authentication Failed',
                    message: 'Login failed. No user data returned.',
                    code: 'NO_USER_DATA'
                },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: {
                id: data.user.id,
                email: data.user.email,
            }
        });

    } catch (error) {
        console.error('Server error during login:', error);

        return NextResponse.json(
            {
                error: 'Server Error',
                message: 'An unexpected error occurred. Please try again later.',
                code: 'SERVER_ERROR',
                details: process.env.NODE_ENV === 'development' ? String(error) : undefined
            },
            { status: 500 }
        );
    }
}
