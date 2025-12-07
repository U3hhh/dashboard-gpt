'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
    return (
        <Suspense fallback={<div className={styles.loading}><div className={styles.spinner}></div></div>}>
            <SubscriptionsContent />
        </Suspense>
    );
}

function SubscriptionsContent() {
    const { t, language } = useLanguage();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const searchParams = useSearchParams();
    const initialFilter = searchParams.get('filter') || 'all';
    const [filter, setFilter] = useState<string>(initialFilter);
    const router = useRouter();

    // ... (handlers)
    const handleRenew = (subscriberId: string) => {
        if (subscriberId) {
            router.push(`/dashboard/subscriptions/new?subscriberId=${subscriberId}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الاشتراك؟' : 'Are you sure you want to delete this subscription?')) return;

        try {
            const res = await fetch(`/api/subscriptions/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                // Refresh list
                setPage(1); // Reset to first page to trigger re-fetch
                // Or force re-fetch
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: '10',
                });
                if (filter !== 'all') params.append('status', filter);

                fetch(`/api/subscriptions?${params}`)
                    .then(res => res.json())
                    .then((data: PaginatedResponse) => {
                        setSubscriptions(data?.data && Array.isArray(data.data) ? data.data : []);
                        setTotalPages(data?.totalPages || 1);
                    });
            } else {
                alert('Failed to delete subscription');
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '10',
        });

        if (filter === 'expiring') {
            params.append('expiring_soon', 'true');
            params.append('status', 'active'); // Only active subs expire
        } else if (filter !== 'all') {
            params.append('status', filter);
        }

        fetch(`/api/subscriptions?${params}`)
            .then(res => res.json())
            .then((response) => {
                // Handle both old format {data, totalPages} and new format {data, pagination: {totalPages}}
                const data = response?.data && Array.isArray(response.data) ? response.data : [];
                const pages = response?.pagination?.totalPages || response?.totalPages || 1;
                setSubscriptions(data);
                setTotalPages(pages);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [page, filter]);

    // Group subscriptions by subscriber
    const groupedSubscriptions = useMemo(() => {
        const groups: Record<string, Subscription[]> = {};
        subscriptions.forEach(sub => {
            const subscriberId = sub.subscriber?.id || 'unknown';
            if (!groups[subscriberId]) {
                groups[subscriberId] = [];
            }
            groups[subscriberId].push(sub);
        });

        return Object.values(groups).map(group => {
            // Sort by end_date descending to get the latest
            group.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
            return {
                latest: group[0],
                count: group.length,
                all: group
            };
        });
    }, [subscriptions]);

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
                    <button
                        className={`${styles.filterBtn} ${filter === 'expiring' ? styles.active : ''}`}
                        onClick={() => setFilter('expiring')}
                    >
                        {language === 'ar' ? 'تنتهي قريباً' : 'Expiring Soon'}
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
                                        <td>
                                            <div>{formatDate(sub.end_date, language)}</div>
                                            {sub.status === 'active' && (
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: (() => {
                                                        const endDate = new Date(sub.end_date);
                                                        endDate.setHours(0, 0, 0, 0);
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        const diffTime = endDate.getTime() - today.getTime();
                                                        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                        return days <= 7 ? 'var(--color-danger)' : 'var(--color-text-muted)';
                                                    })(),
                                                    marginTop: '0.25rem',
                                                    fontWeight: 500
                                                }}>
                                                    {(() => {
                                                        const endDate = new Date(sub.end_date);
                                                        endDate.setHours(0, 0, 0, 0);
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        const diffTime = endDate.getTime() - today.getTime();
                                                        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                        if (days < 0) return language === 'ar' ? 'منتهية' : 'Expired';
                                                        if (days === 0) return language === 'ar' ? 'تنتهي اليوم' : 'Expires today';
                                                        if (days === 1) return language === 'ar' ? 'يوم واحد متبقي' : '1 day left';
                                                        return language === 'ar' ? `متبقي ${days} يوم` : `${days} days left`;
                                                    })()}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleRenew(sub.subscriber?.id || '')}
                                                    className={styles.viewBtn}
                                                    title={language === 'ar' ? 'تجديد' : 'Renew'}
                                                    style={{ color: 'var(--color-primary)' }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M23 4v6h-6" />
                                                        <path d="M1 20v-6h6" />
                                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                                    </svg>
                                                </button>
                                                <Link href={`/dashboard/subscriptions/${sub.id}`} className={styles.viewBtn} title={language === 'ar' ? 'تعديل' : 'Edit'}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(sub.id)}
                                                    className={styles.viewBtn}
                                                    title={language === 'ar' ? 'حذف' : 'Delete'}
                                                    style={{ color: 'var(--color-danger)' }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className={styles.pagination}>
                <span className={styles.pageInfo} style={{ marginRight: 'auto' }}>
                    {language === 'ar' ? `المجموع: ${subscriptions.length}` : `Total: ${subscriptions.length}`}
                </span>
                <button
                    className={styles.pageBtn}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    ← {language === 'ar' ? 'السابق' : 'Prev'}
                </button>
                <span className={styles.pageInfo}>
                    {language === 'ar' ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
                </span>
                <button
                    className={styles.pageBtn}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                >
                    {language === 'ar' ? 'التالي' : 'Next'} →
                </button>
            </div>
        </div>
    );
}
