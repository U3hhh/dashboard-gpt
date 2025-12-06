'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState<'en' | 'ar'>('en');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.status === 'success') {
                // Clear demo mode cookie if it exists
                document.cookie = 'demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

                // Store auth mode
                localStorage.setItem('authMode', 'real');
                localStorage.removeItem('demoUser');

                // Show success message if needed, or just redirect
                router.push('/dashboard');
            } else {
                // Show detailed error message from API
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            console.error('Login fetch error:', err);
            setError('Network connection failed. Please check your internet connection and try again.');
        }
        setLoading(false);
    };

    // Arabic error messages mapping
    const getArabicError = (code: string, fallback: string): string => {
        const arabicErrors: Record<string, string> = {
            'MISSING_CREDENTIALS': 'البريد الإلكتروني وكلمة المرور مطلوبان',
            'INVALID_EMAIL': 'صيغة البريد الإلكتروني غير صحيحة',
            'INVALID_CREDENTIALS': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
            'EMAIL_NOT_VERIFIED': 'يرجى التحقق من بريدك الإلكتروني قبل تسجيل الدخول',
            'RATE_LIMITED': 'محاولات كثيرة. يرجى الانتظار والمحاولة مرة أخرى',
            'USER_NOT_FOUND': 'لا يوجد حساب بهذا البريد الإلكتروني',
            'NETWORK_ERROR': 'خطأ في الشبكة. يرجى التحقق من اتصالك',
            'SERVER_ERROR': 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً',
            'AUTH_ERROR': 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى',
        };
        return arabicErrors[code] || fallback;
    };


    const handleDemoMode = async () => {
        setDemoLoading(true);
        setError(null);

        try {
            // Set demo mode in localStorage AND cookie (so server can check)
            localStorage.setItem('authMode', 'demo');
            localStorage.setItem('demoUser', JSON.stringify({
                email: 'demo@example.com',
                name: 'Demo User',
                role: 'admin',
            }));

            // Set cookie for server-side demo mode detection
            document.cookie = 'demo_mode=true; path=/; max-age=86400';

            // Redirect to dashboard
            router.push('/dashboard');
        } catch {
            setError('Failed to enter demo mode');
        }
        setDemoLoading(false);
    };

    const t = {
        title: language === 'ar' ? 'تسجيل الدخول' : 'Sign In',
        subtitle: language === 'ar' ? 'مرحباً بعودتك' : 'Welcome back',
        email: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
        password: language === 'ar' ? 'كلمة المرور' : 'Password',
        submit: language === 'ar' ? 'تسجيل الدخول' : 'Sign In',
        loading: language === 'ar' ? 'جاري التحميل...' : 'Signing in...',
        orText: language === 'ar' ? 'أو' : 'or',
        demoBtn: language === 'ar' ? 'تجربة الوضع التجريبي' : 'Try Demo Mode',
        demoLoading: language === 'ar' ? 'جاري التحميل...' : 'Loading...',
        demoNote: language === 'ar'
            ? 'الوضع التجريبي يستخدم بيانات وهمية. بعض الميزات مثل لقطات الشاشة غير متاحة.'
            : 'Demo mode uses mock data. Some features like screenshots are not available.',
    };

    return (
        <div className={styles.container} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Background */}
            <div className="bg-mesh" />

            {/* Language Toggle */}
            <button
                className={styles.langToggle}
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            >
                {language === 'en' ? 'العربية' : 'English'}
            </button>

            {/* Login Card */}
            <div className={styles.card}>
                {/* Logo */}
                <div className={styles.logo}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                            stroke="url(#loginGradient)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <defs>
                            <linearGradient id="loginGradient" x1="2" y1="2" x2="22" y2="22">
                                <stop stopColor="#8b5cf6" />
                                <stop offset="1" stopColor="#06b6d4" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className={styles.logoText}>SubAdmin</span>
                </div>

                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>{t.title}</h1>
                    <p className={styles.subtitle}>{t.subtitle}</p>
                </div>

                {/* Error */}
                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label className={styles.label}>{t.email}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            placeholder="admin@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>{t.password}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? t.loading : t.submit}
                    </button>
                </form>

                {/* Divider */}
                <div className={styles.divider}>
                    <span>{t.orText}</span>
                </div>

                {/* Demo Mode Button */}
                <button
                    type="button"
                    className={styles.demoBtn}
                    onClick={handleDemoMode}
                    disabled={demoLoading}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
                        <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                        <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" />
                        <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" />
                        <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" />
                        <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
                        <path d="M10 9.5C10 10.33 9.33 11 8.5 11h-5C2.67 11 2 10.33 2 9.5S2.67 8 3.5 8h5c.83 0 1.5.67 1.5 1.5z" />
                        <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z" />
                    </svg>
                    {demoLoading ? t.demoLoading : t.demoBtn}
                </button>

                {/* Demo Note */}
                <p className={styles.demoNote}>
                    {t.demoNote}
                </p>
            </div>

            {/* Footer */}
            <p className={styles.footer}>
                Subscription Admin Dashboard © {new Date().getFullYear()}
            </p>
        </div>
    );
}
