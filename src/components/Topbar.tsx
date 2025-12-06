'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n';
import styles from './Topbar.module.css';

interface TopbarProps {
    onMenuToggle: () => void;
    userEmail?: string;
}

export default function Topbar({ onMenuToggle, userEmail = 'user@example.com' }: TopbarProps) {
    const { language, setLanguage, t } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ar' : 'en');
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

                {/* Notifications */}
                <button className={styles.iconBtn} title={t('common.notifications')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span className={styles.badge}>3</span>
                </button>

                {/* User Menu */}
                <div className={styles.userMenu}>
                    <div className={styles.avatar}>
                        {userEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.userInfo}>
                        <span className={styles.userEmail}>{userEmail}</span>
                        <span className={styles.userRole}>Admin</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </div>
        </header>
    );
}
