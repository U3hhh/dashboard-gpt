'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import styles from '../subscriptions/page.module.css';

interface Subscriber {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
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
    const router = useRouter();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    // Edit Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    const fetchSubscribers = () => {
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
    };

    useEffect(() => {
        fetchSubscribers();
    }, [page, search]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPage(1);
    };

    const handleEdit = (subscriber: Subscriber) => {
        setEditingSubscriber(subscriber);
        setFormData({
            name: subscriber.name,
            email: subscriber.email || '',
            phone: subscriber.phone || '',
            address: subscriber.address || '',
            notes: subscriber.notes || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المشترك؟' : 'Are you sure you want to delete this subscriber?')) return;

        try {
            const res = await fetch(`/api/subscribers/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchSubscribers();
            } else {
                alert('Failed to delete subscriber');
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleRenew = (id: string) => {
        router.push(`/dashboard/subscriptions/new?subscriberId=${id}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSubscriber) return;
        setSaving(true);

        try {
            const res = await fetch(`/api/subscribers/${editingSubscriber.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                fetchSubscribers();
                setShowModal(false);
            } else {
                alert('Failed to update subscriber');
            }
        } catch (error) {
            console.error('Update error:', error);
        } finally {
            setSaving(false);
        }
    };

    const tr = {
        edit: language === 'ar' ? 'تعديل' : 'Edit',
        delete: language === 'ar' ? 'حذف' : 'Delete',
        renew: language === 'ar' ? 'تجديد' : 'Renew',
        editSubscriber: language === 'ar' ? 'تعديل المشترك' : 'Edit Subscriber',
        name: language === 'ar' ? 'الاسم' : 'Name',
        email: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
        phone: language === 'ar' ? 'الهاتف' : 'Phone',
        address: language === 'ar' ? 'العنوان' : 'Address',
        notes: language === 'ar' ? 'ملاحظات' : 'Notes',
        save: language === 'ar' ? 'حفظ' : 'Save',
        cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
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
                    style={{ maxWidth: '300px', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
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
                                <th>{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
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
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Link href={`/dashboard/subscribers/${sub.id}`} className={styles.viewBtn} title={t('common.view')}>
                                                {language === 'ar' ? 'عرض' : 'View'}
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(sub.id)}
                                                className={styles.deleteBtn}
                                                title={t('common.delete')}
                                            >
                                                {language === 'ar' ? 'حذف' : 'Delete'}
                                            </button>
                                        </div>
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

            {/* Edit Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>{tr.editSubscriber}</h2>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.modalField}>
                                <label>{tr.name} *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.modalField}>
                                <label>{tr.email}</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className={styles.modalField}>
                                <label>{tr.phone}</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className={styles.modalField}>
                                <label>{tr.address}</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className={styles.modalField}>
                                <label>{tr.notes}</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', width: '100%' }}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                                    {tr.cancel}
                                </button>
                                <button type="submit" className={styles.saveBtn} disabled={saving}>
                                    {saving ? '...' : tr.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
