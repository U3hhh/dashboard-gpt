'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage, formatIQD } from '@/lib/i18n';
import styles from '../subscriptions/page.module.css';

interface Subscription {
    id: string;
    price: number;
    start_date: string;
    end_date: string;
    subscriber?: { id: string; name: string; email: string; phone: string };
    plan?: { id: string; name: string };
}

interface GroupedSubscriber {
    subscriberId: string;
    subscriberName: string;
    subscriberEmail: string;
    subscriberPhone: string;
    subscriptions: Subscription[];
    totalAmount: number;
}

export default function UnpaidPage() {
    const { t, language } = useLanguage();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    const fetchUnpaid = () => {
        setLoading(true);
        fetch('/api/unpaid')
            .then(res => res.json())
            .then((data) => {
                setSubscriptions(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchUnpaid();
    }, []);

    // Group subscriptions by subscriber
    const groupedSubscribers = useMemo((): GroupedSubscriber[] => {
        const groups: Record<string, GroupedSubscriber> = {};

        subscriptions.forEach(sub => {
            const subscriberId = sub.subscriber?.id || 'unknown';
            if (!groups[subscriberId]) {
                groups[subscriberId] = {
                    subscriberId,
                    subscriberName: sub.subscriber?.name || 'Unknown',
                    subscriberEmail: sub.subscriber?.email || '',
                    subscriberPhone: sub.subscriber?.phone || '-',
                    subscriptions: [],
                    totalAmount: 0
                };
            }
            groups[subscriberId].subscriptions.push(sub);
            groups[subscriberId].totalAmount += sub.price;
        });

        return Object.values(groups);
    }, [subscriptions]);

    const handleMarkPaid = async (subscriptionId: string) => {
        setProcessing(subscriptionId);
        try {
            const res = await fetch('/api/unpaid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription_id: subscriptionId }),
            });

            if (res.ok) {
                // Remove from list
                setSubscriptions(prev => prev.filter(s => s.id !== subscriptionId));
            }
        } catch (error) {
            console.error('Failed to mark as paid:', error);
        }
        setProcessing(null);
    };

    const handleMarkAllPaid = async (subs: Subscription[]) => {
        for (const sub of subs) {
            await handleMarkPaid(sub.id);
        }
    };

    const totalUnpaid = subscriptions.reduce((sum, s) => sum + s.price, 0);

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t('nav.unpaid')}</h1>
                    <p className={styles.subtitle}>
                        {language === 'ar'
                            ? `${subscriptions.length} اشتراك غير مدفوع | المجموع: ${formatIQD(totalUnpaid, language)}`
                            : `${subscriptions.length} unpaid subscriptions | Total: ${formatIQD(totalUnpaid, language)}`
                        }
                    </p>
                </div>
            </div>

            {/* Grouped Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : groupedSubscribers.length === 0 ? (
                    <div className={styles.empty}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <p>{language === 'ar' ? 'جميع الاشتراكات مدفوعة! 🎉' : 'All subscriptions are paid! 🎉'}</p>
                    </div>
                ) : (
                    groupedSubscribers.map((group) => (
                        <div
                            key={group.subscriberId}
                            style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '1rem',
                                background: 'var(--color-bg-secondary)',
                            }}
                        >
                            {/* Subscriber Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.75rem',
                                paddingBottom: '0.75rem',
                                borderBottom: '1px solid var(--color-border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                                                {group.subscriberName}
                                            </span>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                background: 'var(--color-danger)',
                                                color: 'white',
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: '1rem',
                                                fontWeight: 'bold'
                                            }}>
                                                {group.subscriptions.length} {language === 'ar' ? 'غير مدفوع' : 'unpaid'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            {group.subscriberPhone}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {language === 'ar' ? 'المجموع' : 'Total'}
                                        </div>
                                        <div style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
                                            {formatIQD(group.totalAmount, language)}
                                        </div>
                                    </div>
                                    {group.subscriptions.length > 1 && (
                                        <button
                                            className={styles.addBtn}
                                            onClick={() => handleMarkAllPaid(group.subscriptions)}
                                            style={{
                                                padding: 'var(--space-2) var(--space-4)',
                                                fontSize: 'var(--text-xs)',
                                            }}
                                        >
                                            {language === 'ar' ? 'دفع الكل' : 'Pay All'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Subscriptions List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {group.subscriptions.map((sub) => (
                                    <div
                                        key={sub.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.5rem 0.75rem',
                                            background: 'var(--color-bg-primary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{ fontSize: '0.875rem' }}>
                                                {sub.plan?.name || 'Custom'}
                                            </span>
                                            <span style={{
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                color: 'var(--color-danger)'
                                            }}>
                                                {formatIQD(sub.price, language)}
                                            </span>
                                        </div>
                                        <button
                                            className={styles.addBtn}
                                            onClick={() => handleMarkPaid(sub.id)}
                                            disabled={processing === sub.id}
                                            style={{
                                                padding: 'var(--space-1) var(--space-3)',
                                                fontSize: 'var(--text-xs)',
                                                opacity: processing === sub.id ? 0.5 : 1,
                                            }}
                                        >
                                            {processing === sub.id
                                                ? (language === 'ar' ? 'جاري...' : '...')
                                                : (language === 'ar' ? 'دفع' : 'Pay')
                                            }
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

