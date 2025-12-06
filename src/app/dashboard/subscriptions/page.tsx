'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage, formatIQD, formatDate } from '@/lib/i18n';
import styles from './page.module.css';

interface Subscription {
    id: string;
    status: 'active' | 'expired' | 'cancelled' | 'pending';
    payment_status: 'paid' | 'unpaid' | 'partial';
    price: number;
    start_date: string;
    end_date: string;
    subscriber?: { id: string; name: string; email: string };
    plan?: { id: string; name: string };
}

interface PaginatedResponse {
    data: Subscription[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function SubscriptionsPage() {
    const { t, language } = useLanguage();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '10',
        });
        if (filter !== 'all') {
            params.append('status', filter);
        }

        fetch(`/api/subscriptions?${params}`)
            .then(res => res.json())
            .then((data: PaginatedResponse) => {
                setSubscriptions(data?.data && Array.isArray(data.data) ? data.data : []);
                setTotalPages(data?.totalPages || 1);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [page, filter]);

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { class: string; label: string }> = {
            active: { class: styles.badgeSuccess, label: t('common.active') },
            expired: { class: styles.badgeDanger, label: t('common.expired') },
            cancelled: { class: styles.badgeMuted, label: t('common.cancelled') },
            pending: { class: styles.badgeWarning, label: t('common.pending') },
        };
        return badges[status] || { class: '', label: status };
    };

    const getPaymentBadge = (status: string) => {
        const badges: Record<string, { class: string; label: string }> = {
            paid: { class: styles.badgeSuccess, label: t('common.paid') },
            unpaid: { class: styles.badgeDanger, label: t('common.unpaid') },
            partial: { class: styles.badgeWarning, label: t('common.pending') },
        };
        return badges[status] || { class: '', label: status };
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t('nav.subscriptions')}</h1>
                    <p className={styles.subtitle}>
                        {language === 'ar' ? 'إدارة جميع الاشتراكات' : 'Manage all subscriptions'}
                    </p>
                </div>
                <Link href="/dashboard/subscriptions/new" className={styles.addBtn}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>{language === 'ar' ? 'اشتراك جديد' : 'New Subscription'}</span>
                </Link>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <button
                        className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        {language === 'ar' ? 'الكل' : 'All'}
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'active' ? styles.active : ''}`}
                        onClick={() => setFilter('active')}
                    >
                        {t('common.active')}
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'expired' ? styles.active : ''}`}
                        onClick={() => setFilter('expired')}
                    >
                        {t('common.expired')}
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'cancelled' ? styles.active : ''}`}
                        onClick={() => setFilter('cancelled')}
                    >
                        {t('common.cancelled')}
                    </button>
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
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6M12 18v-6M9 15h6" />
                        </svg>
                        <p>{language === 'ar' ? 'لا توجد اشتراكات' : 'No subscriptions found'}</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{language === 'ar' ? 'المشترك' : 'Subscriber'}</th>
                                <th>{language === 'ar' ? 'الخطة' : 'Plan'}</th>
                                <th>{language === 'ar' ? 'السعر' : 'Price'}</th>
                                <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                                <th>{language === 'ar' ? 'الدفع' : 'Payment'}</th>
                                <th>{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptions.map((sub) => {
                                const statusBadge = getStatusBadge(sub.status);
                                const paymentBadge = getPaymentBadge(sub.payment_status);
                                return (
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
                                        <td>
                                            <span className={`${styles.badge} ${statusBadge.class}`}>
                                                {statusBadge.label}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${paymentBadge.class}`}>
                                                {paymentBadge.label}
                                            </span>
                                        </td>
                                        <td>{formatDate(sub.end_date, language)}</td>
                                        <td>
                                            <Link href={`/dashboard/subscriptions/${sub.id}`} className={styles.viewBtn}>
                                                {t('common.view')}
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        className={styles.pageBtn}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        ←
                    </button>
                    <span className={styles.pageInfo}>
                        {page} / {totalPages}
                    </span>
                    <button
                        className={styles.pageBtn}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    );
}
