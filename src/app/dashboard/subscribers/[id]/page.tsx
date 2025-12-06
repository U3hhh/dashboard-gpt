'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage, formatIQD, formatDate } from '@/lib/i18n';
import styles from '../../subscriptions/page.module.css';

interface SubscriberDetails {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    subscriptions: Array<{
        id: string;
        plan: { name: string; price: number };
        start_date: string;
        end_date: string;
        status: string;
        payment_status: string;
        price: number;
    }>;
}

export default function SubscriberDetailsPage() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const params = useParams();
    const [subscriber, setSubscriber] = useState<SubscriberDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params?.id) {
            fetch(`/api/subscribers/${params.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        alert('Subscriber not found');
                        router.push('/dashboard/subscribers');
                    } else {
                        setSubscriber(data);
                    }
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                });
        }
    }, [params?.id]);

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    if (!subscriber) return null;

    const totalUnpaid = subscriber.subscriptions
        .filter(sub => sub.payment_status === 'unpaid')
        .reduce((sum, sub) => sum + Number(sub.price), 0);

    const totalSubscribed = subscriber.subscriptions
        .reduce((sum, sub) => sum + Number(sub.price), 0);

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <Link href="/dashboard/subscribers" className={styles.viewBtn}>
                            ← {language === 'ar' ? 'عودة' : 'Back'}
                        </Link>
                        <h1 className={styles.title}>{subscriber.name}</h1>
                        <span className={`${styles.badge} ${subscriber.is_active ? styles.badgeSuccess : styles.badgeMuted}`}>
                            {subscriber.is_active ? t('common.active') : t('common.inactive')}
                        </span>
                    </div>
                    <p className={styles.subtitle}>
                        {subscriber.email || '-'} • {subscriber.phone || '-'}
                    </p>
                </div>
                <Link href={`/dashboard/subscriptions/new?subscriberId=${subscriber.id}`} className={styles.addBtn}>
                    <span>{language === 'ar' ? 'اشتراك جديد' : 'New Subscription'}</span>
                </Link>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                        {language === 'ar' ? 'إجمالي غير مدفوع' : 'Total Unpaid'}
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-danger)' }}>
                        {formatIQD(totalUnpaid, language)}
                    </span>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                        {language === 'ar' ? 'إجمالي الاشتراكات' : 'Total Subscribed'}
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                        {formatIQD(totalSubscribed, language)}
                    </span>
                </div>
                <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                        {language === 'ar' ? 'عدد الاشتراكات' : 'Subscription Count'}
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text)' }}>
                        {subscriber.subscriptions.length}
                    </span>
                </div>
            </div>

            {/* Subscriptions History */}
            <div className={styles.tableWrapper}>
                <h2 style={{ padding: '1rem', fontSize: '1.125rem', fontWeight: '600', borderBottom: '1px solid var(--color-border)' }}>
                    {language === 'ar' ? 'سجل الاشتراكات' : 'Subscription History'}
                </h2>
                {subscriber.subscriptions.length === 0 ? (
                    <div className={styles.empty}>
                        <p>{language === 'ar' ? 'لا توجد اشتراكات' : 'No subscriptions found'}</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{language === 'ar' ? 'الخطة' : 'Plan'}</th>
                                <th>{language === 'ar' ? 'السعر' : 'Price'}</th>
                                <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                                <th>{language === 'ar' ? 'الدفع' : 'Payment'}</th>
                                <th>{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</th>
                                <th>{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriber.subscriptions.map((sub) => (
                                <tr key={sub.id}>
                                    <td>{sub.plan?.name || 'Custom'}</td>
                                    <td className={styles.price}>{formatIQD(sub.price, language)}</td>
                                    <td>
                                        <span className={`${styles.badge} ${sub.status === 'active' ? styles.badgeSuccess : styles.badgeMuted}`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${sub.payment_status === 'paid' ? styles.badgeSuccess : styles.badgeDanger}`}>
                                            {sub.payment_status}
                                        </span>
                                    </td>
                                    <td>{formatDate(sub.start_date, language)}</td>
                                    <td>{formatDate(sub.end_date, language)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
