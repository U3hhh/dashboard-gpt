'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import styles from '../subscriptions/page.module.css';

interface Subscriber {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string;
    subscription_count?: number;
}

interface PaginatedResponse {
    data: Subscriber[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function SubscribersPage() {
    const { t, language } = useLanguage();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '10',
        });
        if (search) {
            params.append('search', search);
        }

        fetch(`/api/subscribers?${params}`)
            .then(res => res.json())
            .then((data: PaginatedResponse) => {
                setSubscribers(data?.data && Array.isArray(data.data) ? data.data : []);
                setTotalPages(data?.totalPages || 1);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [page, search]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPage(1);
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t('nav.subscribers')}</h1>
                    <p className={styles.subtitle}>
                        {language === 'ar' ? 'إدارة جميع المشتركين' : 'Manage all subscribers'}
                    </p>
                </div>
                <Link href="/dashboard/subscribers/new" className={styles.addBtn}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>{language === 'ar' ? 'مشترك جديد' : 'New Subscriber'}</span>
                </Link>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className={styles.filters}>
                <input
                    type="text"
                    placeholder={t('common.search')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input"
                    style={{ maxWidth: '300px' }}
                />
            </form>

            {/* Table */}
            <div className={styles.tableWrapper}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : subscribers.length === 0 ? (
                    <div className={styles.empty}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <p>{language === 'ar' ? 'لا يوجد مشتركين' : 'No subscribers found'}</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                                <th>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                                <th>{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                                <th>{language === 'ar' ? 'الاشتراكات' : 'Subscriptions'}</th>
                                <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscribers.map((sub) => (
                                <tr key={sub.id}>
                                    <td>
                                        <span style={{ fontWeight: 600 }}>{sub.name}</span>
                                    </td>
                                    <td>{sub.email || '-'}</td>
                                    <td>{sub.phone || '-'}</td>
                                    <td>{sub.subscription_count || 0}</td>
                                    <td>
                                        <span className={`${styles.badge} ${sub.is_active ? styles.badgeSuccess : styles.badgeMuted}`}>
                                            {sub.is_active ? t('common.active') : t('common.inactive')}
                                        </span>
                                    </td>
                                    <td>
                                        <Link href={`/dashboard/subscribers/${sub.id}`} className={styles.viewBtn}>
                                            {t('common.view')}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
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
