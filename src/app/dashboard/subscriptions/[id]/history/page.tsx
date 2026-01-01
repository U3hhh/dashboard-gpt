'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage, formatIQD, formatDate } from '@/lib/i18n';
import styles from './page.module.css';
import Link from 'next/link';

interface SubscriptionHistoryPageProps {
    params: Promise<{
        id: string;
    }>;
}

interface ActivityLog {
    id: string;
    action: string;
    created_at: string;
    details: any;
    entity_id: string;
    entity_type: string;
}

interface Subscription {
    id: string;
    subscriber?: { name: string };
    plan?: { name: string };
    status: string;
}

export default function SubscriptionHistoryPage({ params }: SubscriptionHistoryPageProps) {
    const { id } = React.use(params);
    const { language, t } = useLanguage();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch current subscription details to get the subscriber ID
                const subRes = await fetch(`/api/subscriptions/${id}`);
                if (subRes.ok) {
                    const subData = await subRes.json();
                    setSubscription(subData);

                    // 2. Fetch all activity logs for this subscriber (including all their subscriptions)
                    const subscriberId = subData.subscriber_id;
                    const logsRes = await fetch(`/api/activity?subscriber_id=${subscriberId}`);
                    if (logsRes.ok) {
                        const logsData = await logsRes.json();
                        setLogs(logsData);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch history data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const handleDeleteLog = async (logId: string) => {
        if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this log?')) return;

        try {
            const res = await fetch(`/api/activity/${logId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setLogs(prev => prev.filter(log => log.id !== logId));
            } else {
                alert('Failed to delete log');
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    // Filter for relevant actions
    const historyLogs = logs.filter(log =>
        ['subscription.created', 'subscription.renewed', 'subscription.updated'].includes(log.action)
    );

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        {language === 'ar' ? 'سجل الاشتراكات' : 'Subscription History'}
                    </h1>
                    {subscription && (
                        <div className={styles.subtitle}>
                            {subscription.subscriber?.name} - {subscription.plan?.name}
                        </div>
                    )}
                </div>

                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
                        onClick={() => setViewMode('list')}
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
                        className={`${styles.toggleBtn} ${viewMode === 'cards' ? styles.active : ''}`}
                        onClick={() => setViewMode('cards')}
                        title={language === 'ar' ? 'بطاقات' : 'Card View'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                    </button>
                </div>

                <Link href="/dashboard/subscriptions" className={styles.backBtn}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {language === 'ar'
                            ? <path d="M5 12h14M12 5l7 7-7 7" />
                            : <path d="M19 12H5M12 19l-7-7 7-7" />
                        }
                    </svg>
                    {language === 'ar' ? 'رجوع' : 'Back'}
                </Link>
            </div>

            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : historyLogs.length === 0 ? (
                    <div className={styles.empty}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <p>{language === 'ar' ? 'لا يوجد سجل لهذا الاشتراك' : 'No history found for this subscription'}</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className={styles.timeline}>
                        {historyLogs.map((log, index) => {
                            const isCreation = log.action === 'subscription.created';
                            const price = log.details?.price || 0;
                            const renewalCount = log.details?.renewal_count || (isCreation ? 1 : null);

                            return (
                                <div key={log.id} className={`${styles.timelineItem} ${index === 0 ? styles.current : ''}`}>
                                    <div className={styles.itemHeader}>
                                        <span className={styles.itemDate}>
                                            {formatDate(log.created_at, language)}
                                        </span>
                                        <span className={styles.itemPrice}>
                                            {formatIQD(price, language)}
                                        </span>
                                    </div>
                                    <div className={styles.itemDetails}>
                                        {isCreation
                                            ? (language === 'ar' ? 'تم إنشاء الاشتراك' : 'Subscription Created')
                                            : (language === 'ar' ? `تجديد #${renewalCount}` : `Renewal #${renewalCount}`)
                                        }
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.historyGrid}>
                        {historyLogs.map((log) => {
                            const isCreation = log.action === 'subscription.created';
                            const price = log.details?.price || 0;
                            const renewalCount = log.details?.renewal_count || (isCreation ? 1 : null);

                            return (
                                <div key={log.id} className={styles.historyCard}>
                                    <div className={styles.historyCardHeader}>
                                        <span>{formatDate(log.created_at, language)}</span>
                                        <span className={styles.historyCardPrice}>{formatIQD(price, language)}</span>
                                    </div>
                                    <div className={styles.historyCardDetails}>
                                        <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>
                                            {isCreation
                                                ? (language === 'ar' ? 'إنشاء' : 'Created')
                                                : (language === 'ar' ? 'تجديد' : 'Renewal')
                                            }
                                        </span>
                                        <span>
                                            {isCreation
                                                ? (language === 'ar' ? 'تم إنشاء الاشتراك لأول مرة' : 'Initial subscription')
                                                : (language === 'ar' ? `عملية التجديد رقم ${renewalCount}` : `Renewal process #${renewalCount}`)
                                            }
                                        </span>
                                    </div>

                                    {expandedLogId === log.id && (
                                        <div className={styles.detailsSection}>
                                            {log.details.plan_name && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>{language === 'ar' ? 'الخطة' : 'Plan'}</span>
                                                    <span className={styles.detailValue}>{log.details.plan_name}</span>
                                                </div>
                                            )}
                                            {log.details.start_date && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</span>
                                                    <span className={styles.detailValue}>{formatDate(log.details.start_date, language)}</span>
                                                </div>
                                            )}
                                            {log.details.end_date && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</span>
                                                    <span className={styles.detailValue}>{formatDate(log.details.end_date, language)}</span>
                                                </div>
                                            )}
                                            {log.details.status && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>{language === 'ar' ? 'الحالة' : 'Status'}</span>
                                                    <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>
                                                        {log.details.status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') :
                                                            log.details.status === 'expired' ? (language === 'ar' ? 'منتهي' : 'Expired') :
                                                                log.details.status}
                                                    </span>
                                                </div>
                                            )}
                                            {log.details.payment_status && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>{language === 'ar' ? 'حالة الدفع' : 'Payment'}</span>
                                                    <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>
                                                        {log.details.payment_status === 'paid' ? (language === 'ar' ? 'مدفوع' : 'Paid') :
                                                            log.details.payment_status === 'unpaid' ? (language === 'ar' ? 'غير مدفوع' : 'Unpaid') :
                                                                log.details.payment_status}
                                                    </span>
                                                </div>
                                            )}
                                            {log.details.notes && (
                                                <div className={styles.detailNotes}>
                                                    <span className={styles.detailLabel}>{language === 'ar' ? 'ملاحظات' : 'Notes'}</span>
                                                    <span className={styles.detailValue}>{log.details.notes}</span>
                                                </div>
                                            )}
                                            {!log.details.start_date && !log.details.end_date && !log.details.notes && !log.details.plan_name && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailValue} style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                                        {language === 'ar' ? 'لا توجد تفاصيل إضافية' : 'No additional details available'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className={styles.cardFooter} style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className={styles.viewDetailsBtn}
                                            style={{ flex: 1 }}
                                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                        >
                                            {expandedLogId === log.id
                                                ? (language === 'ar' ? 'إخفاء التفاصيل' : 'Hide Details')
                                                : (language === 'ar' ? 'عرض التفاصيل' : 'View Details')
                                            }
                                        </button>
                                        <button
                                            className={styles.viewDetailsBtn}
                                            style={{ width: 'auto', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                                            onClick={() => handleDeleteLog(log.id)}
                                            title={language === 'ar' ? 'حذف' : 'Delete'}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        </div>
    );
}
