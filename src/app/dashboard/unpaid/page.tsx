'use client';

import React, { useState, useEffect } from 'react';
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
                setSubscriptions(data || []);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchUnpaid();
    }, []);

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

            {/* Table */}
            <div className={styles.tableWrapper}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : subscriptions.length === 0 ? (
                    <div className={styles.empty}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <p>{language === 'ar' ? 'جميع الاشتراكات مدفوعة! 🎉' : 'All subscriptions are paid! 🎉'}</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{language === 'ar' ? 'المشترك' : 'Subscriber'}</th>
                                <th>{language === 'ar' ? 'الخطة' : 'Plan'}</th>
                                <th>{language === 'ar' ? 'المبلغ المستحق' : 'Amount Due'}</th>
                                <th>{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptions.map((sub) => (
                                <tr key={sub.id}>
                                    <td>
                                        <div className={styles.subscriber}>
                                            <span className={styles.subscriberName}>
                                                {sub.subscriber?.name || 'Unknown'}
                                            </span>
                                            <span className={styles.subscriberEmail}>
                                                {sub.subscriber?.email || ''}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{sub.plan?.name || 'Custom'}</td>
                                    <td className={styles.price}>{formatIQD(sub.price, language)}</td>
                                    <td>{sub.subscriber?.phone || '-'}</td>
                                    <td>
                                        <button
                                            className={styles.addBtn}
                                            onClick={() => handleMarkPaid(sub.id)}
                                            disabled={processing === sub.id}
                                            style={{
                                                padding: 'var(--space-2) var(--space-4)',
                                                fontSize: 'var(--text-xs)',
                                                opacity: processing === sub.id ? 0.5 : 1,
                                            }}
                                        >
                                            {processing === sub.id
                                                ? (language === 'ar' ? 'جاري...' : 'Processing...')
                                                : (language === 'ar' ? 'تحديد كمدفوع' : 'Mark Paid')
                                            }
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
