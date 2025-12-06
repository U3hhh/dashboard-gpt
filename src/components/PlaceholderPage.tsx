'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n';

interface PlaceholderPageProps {
    titleKey: string;
    icon: React.ReactNode;
}

export default function PlaceholderPage({ titleKey, icon }: PlaceholderPageProps) {
    const { t, language } = useLanguage();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 'var(--space-6)',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--color-primary-light)',
            }}>
                {icon}
            </div>
            <div>
                <h1 style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    marginBottom: 'var(--space-2)',
                }}>
                    {t(titleKey)}
                </h1>
                <p style={{ fontSize: 'var(--text-sm)' }}>
                    {language === 'ar' ? 'هذه الصفحة قيد التطوير' : 'This page is under development'}
                </p>
            </div>
        </div>
    );
}
