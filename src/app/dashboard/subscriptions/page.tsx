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
    renewal_count: number;
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

    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const searchParams = useSearchParams();
    const initialFilter = searchParams.get('filter') || 'all';
    const [filter, setFilter] = useState<string>(initialFilter);
    const [searchQuery, setSearchQuery] = useState('');

    const [debouncedSearch, setDebouncedSearch] = useState('');
    const router = useRouter();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

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
        } else if (filter === 'unpaid') {
            params.append('payment_status', 'unpaid');
        } else if (filter !== 'all') {
            params.append('status', filter);
        }

        if (debouncedSearch) {
            params.append('search', debouncedSearch);
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
    }, [page, filter, debouncedSearch]);

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

        const sortedGroups = Object.values(groups).map(group => {
            // Sort by status ('active' first) then by end_date descending
            group.sort((a, b) => {
                if (a.status === 'active' && b.status !== 'active') return -1;
                if (a.status !== 'active' && b.status === 'active') return 1;
                return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
            });
            return {
                latest: group[0],
                count: group.length,
                all: group
            };
        });

        // Final Sort of the groups based on the latest subscription in each group
        return sortedGroups.sort((a, b) => {
            if (a.latest.status === 'active' && b.latest.status !== 'active') return -1;
            if (a.latest.status !== 'active' && b.latest.status === 'active') return 1;
            return new Date(b.latest.end_date).getTime() - new Date(a.latest.end_date).getTime();
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
                    <button
                        className={`${styles.filterBtn} ${filter === 'unpaid' ? styles.active : ''}`}
                        onClick={() => setFilter('unpaid')}
                    >
                        {language === 'ar' ? 'غير مدفوع' : 'Unpaid'}
                    </button>
                </div>

                <div className={styles.searchWrapper}>
                    <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder={language === 'ar' ? 'بحث عن مشترك...' : 'Search subscriber...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.active : ''}`}
                        onClick={() => setViewMode('table')}
                        title={language === 'ar' ? 'قائمة' : 'List View'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                        onClick={() => setViewMode('grid')}
                        title={language === 'ar' ? 'شبكة' : 'Grid View'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
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
                ) : viewMode === 'table' ? (
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
                            {groupedSubscriptions.map((group) => {
                                const sub = group.latest;
                                const statusBadge = getStatusBadge(sub.status);
                                const paymentBadge = getPaymentBadge(sub.payment_status);
                                return (
                                    <tr key={sub.id}>
                                        <td>
                                            <div className={styles.subscriber}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span className={styles.subscriberName}>
                                                        {sub.subscriber?.name || 'Unknown'}
                                                    </span>
                                                    {sub.renewal_count > 1 && (
                                                        <Link
                                                            href={`/dashboard/subscriptions/${sub.id}/history`}
                                                            className={styles.renewalBadge}
                                                            style={{
                                                                fontSize: '0.8rem',
                                                                background: 'rgba(239, 68, 68, 0.1)',
                                                                color: 'var(--color-danger)',
                                                                padding: '0.1rem 0.4rem',
                                                                borderRadius: '0.25rem',
                                                                fontWeight: 'bold',
                                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                                cursor: 'pointer',
                                                                textDecoration: 'none',
                                                            }}
                                                            title={language === 'ar' ? 'عرض السجل' : 'View History'}
                                                        >
                                                            {sub.renewal_count}x
                                                        </Link>
                                                    )}
                                                </div>
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
                ) : (
                    <div className={styles.cardGrid}>
                        {groupedSubscriptions.map((group) => {
                            const sub = group.latest;
                            const statusBadge = getStatusBadge(sub.status);
                            const paymentBadge = getPaymentBadge(sub.payment_status);

                            return (
                                <div key={sub.id} className={styles.subCard}>
                                    <div className={styles.subCardBody}>
                                        <div className={styles.subCardInfo}>
                                            <span className={styles.subCardLabel}>{language === 'ar' ? 'المشترك' : 'Subscriber'}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span className={styles.subCardValue}>{sub.subscriber?.name || 'Unknown'}</span>
                                                {sub.renewal_count > 1 && (
                                                    <Link
                                                        href={`/dashboard/subscriptions/${sub.id}/history`}
                                                        className={styles.renewalBadge}
                                                        title={language === 'ar' ? 'عرض السجل' : 'View History'}
                                                        style={{ textDecoration: 'none' }}
                                                    >
                                                        {sub.renewal_count}x
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.subCardInfo}>
                                            <span className={styles.subCardLabel}>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span>
                                            <span className={styles.subCardValue}>{sub.subscriber?.email || ''}</span>
                                        </div>
                                        <div className={styles.subCardInfo}>
                                            <span className={styles.subCardLabel}>{language === 'ar' ? 'الخطة' : 'Plan'}</span>
                                            <span className={styles.subCardValue}>{sub.plan?.name || 'Custom'}</span>
                                        </div>
                                        <div className={styles.subCardInfo}>
                                            <span className={styles.subCardLabel}>{language === 'ar' ? 'السعر' : 'Price'}</span>
                                            <span className={styles.subCardValue} style={{ fontWeight: 700, fontSize: '1.1em' }}>{formatIQD(sub.price, language)}</span>
                                        </div>
                                        <div className={styles.subCardInfo}>
                                            <span className={styles.subCardLabel}>{language === 'ar' ? 'الحالة' : 'Status'}</span>
                                            <span className={`${styles.badge} ${statusBadge.class}`}>
                                                {statusBadge.label}
                                            </span>
                                        </div>
                                        <div className={styles.subCardInfo}>
                                            <span className={styles.subCardLabel}>{language === 'ar' ? 'الدفع' : 'Payment'}</span>
                                            <span className={`${styles.badge} ${paymentBadge.class}`}>
                                                {paymentBadge.label}
                                            </span>
                                        </div>
                                        <div className={styles.subCardInfo}>
                                            <span className={styles.subCardLabel}>{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</span>
                                            <div style={{ textAlign: 'end', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div className={styles.subCardValue}>{formatDate(sub.end_date, language)}</div>
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
                                                        opacity: 0.8
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
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.subCardFooter}>
                                        <button
                                            onClick={() => handleRenew(sub.subscriber?.id || '')}
                                            className={styles.viewBtn}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}
                                            title={language === 'ar' ? 'تجديد' : 'Renew'}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M23 4v6h-6" />
                                                <path d="M1 20v-6h6" />
                                                <path d="M3.51 9a9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                            </svg>
                                        </button>
                                        <Link
                                            href={`/dashboard/subscriptions/${sub.id}`}
                                            className={styles.viewBtn}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}
                                            title={language === 'ar' ? 'تعديل' : 'Edit'}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(sub.id)}
                                            className={styles.viewBtn}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', color: 'var(--color-danger)' }}
                                            title={language === 'ar' ? 'حذف' : 'Delete'}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
