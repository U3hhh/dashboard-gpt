'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
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

            if (res.ok) {
                router.push('/dashboard');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch {
            setError('An error occurred. Please try again.');
        }
        setLoading(false);
    };

    const t = {
        title: language === 'ar' ? 'تسجيل الدخول' : 'Sign In',
        subtitle: language === 'ar' ? 'مرحباً بعودتك' : 'Welcome back',
        email: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
        password: language === 'ar' ? 'كلمة المرور' : 'Password',
        submit: language === 'ar' ? 'تسجيل الدخول' : 'Sign In',
        loading: language === 'ar' ? 'جاري التحميل...' : 'Signing in...',
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
            </div>

            {/* Footer */}
            <p className={styles.footer}>
                Subscription Admin Dashboard © {new Date().getFullYear()}
            </p>
        </div>
    );
}
