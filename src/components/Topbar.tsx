'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import styles from './Topbar.module.css';

interface TopbarProps {
    onMenuToggle: () => void;
    userEmail?: string;
}

export default function Topbar({ onMenuToggle, userEmail = 'user@example.com' }: TopbarProps) {
    const { language, setLanguage, t } = useLanguage();
    const router = useRouter();
    const [isDemo, setIsDemo] = useState(false);
    const [displayEmail, setDisplayEmail] = useState(userEmail);
    const [displayRole, setDisplayRole] = useState('Admin');

    useEffect(() => {
        // Check if in demo mode
        const authMode = localStorage.getItem('authMode');
        if (authMode === 'demo') {
            setIsDemo(true);
            const demoUser = localStorage.getItem('demoUser');
            if (demoUser) {
                const user = JSON.parse(demoUser);
                setDisplayEmail(user.email);
                setDisplayRole(user.role || 'Admin');
            }
        } else {
            // Fetch real user info
            fetch('/api/settings/profile')
                .then(res => res.json())
                .then(data => {
                    if (data.email) {
                        setDisplayEmail(data.email);
                    }
                    if (data.role) {
                        // Format role: head_of_project -> Head Of Project
                        const formattedRole = data.role
                            .split('_')
                            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                        setDisplayRole(formattedRole);
                    }
                })
                .catch(err => console.error('Failed to fetch profile:', err));
        }
    }, []);

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ar' : 'en');
    };

    const handleLogout = () => {
        localStorage.removeItem('authMode');
        localStorage.removeItem('demoUser');
        router.push('/login');
    };

    return (
        <header className={styles.topbar}>
            {/* Mobile Menu Toggle */}
            <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Toggle menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {/* Mobile Logo */}
            <div className={styles.mobileLogo}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                        stroke="url(#logoGradientMobile)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <defs>
                        <linearGradient id="logoGradientMobile" x1="2" y1="2" x2="22" y2="22">
                            <stop stopColor="#8b5cf6" />
                            <stop offset="1" stopColor="#06b6d4" />
                        </linearGradient>
                    </defs>
                </svg>
                <span className={styles.mobileLogoText}>SubAdmin</span>
            </div>

            {/* Demo Mode Badge */}
            {isDemo && (
                <div className={styles.demoBadge}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
                    </svg>
                    {language === 'ar' ? 'وضع تجريبي' : 'Demo Mode'}
                </div>
            )}

            {/* Spacer */}
            <div className={styles.spacer}></div>

            {/* Actions */}
            <div className={styles.actions}>
                {/* Language Toggle */}
                <button
                    className={styles.langToggle}
                    onClick={toggleLanguage}
                    title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
                >
                    <span className={styles.langCode}>{language === 'en' ? 'EN' : 'AR'}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                </button>

                {/* Notifications - hidden in demo mode */}
                {!isDemo && (
                    <button className={styles.iconBtn} title={t('common.notifications')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span className={styles.badge}>3</span>
                    </button>
                )}

                {/* User Menu */}
                <div className={styles.userMenu} onClick={handleLogout} style={{ cursor: 'pointer' }} title={language === 'ar' ? 'تسجيل الخروج' : 'Logout'}>
                    <div className={styles.avatar}>
                        {displayEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.userInfo}>
                        <span className={styles.userEmail}>{displayEmail}</span>
                        <span className={styles.userRole}>{isDemo ? (language === 'ar' ? 'تجريبي' : 'Demo') : displayRole}</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </div>
            </div>
        </header>
    );
}
