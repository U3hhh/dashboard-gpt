'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage, formatIQD, formatDate } from '@/lib/i18n';
import styles from './page.module.css';

// Types
interface DashboardStats {
    totalSubscribers: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    unpaidCount: number;
    expiringSubscriptions: Array<{
        id: string;
        end_date: string;
        price: number;
        subscriber?: { name: string };
        plan?: { name: string };
    }>;
}

interface ActivityLog {
    id: string;
    action: string;
    entity_type: string;
    created_at: string;
    user?: { email: string };
}

// Stat Card Component
function StatCard({
    icon,
    label,
    value,
    trend,
    trendUp,
    isRevenue = false,
    showValue = true,
    onToggleVisibility
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    isRevenue?: boolean;
    showValue?: boolean;
    onToggleVisibility?: () => void;
}) {
    return (
        <div className={styles.statCard}>
            <div className={styles.statIcon}>{icon}</div>
            <div className={styles.statContent}>
                <span className={styles.statLabel}>{label}</span>
                <div className={styles.statValueRow}>
                    <span className={styles.statValue}>
                        {isRevenue && !showValue ? '••••••' : value}
                    </span>
                    {isRevenue && (
                        <button
                            className={styles.visibilityBtn}
                            onClick={onToggleVisibility}
                            aria-label={showValue ? 'Hide value' : 'Show value'}
                        >
                            {showValue ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>
                {trend && (
                    <span className={`${styles.statTrend} ${trendUp ? styles.trendUp : styles.trendDown}`}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </span>
                )}
            </div>
        </div>
    );
}

// Main Dashboard Page
export default function DashboardPage() {
    const { t, language } = useLanguage();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRevenue, setShowRevenue] = useState(false);

    useEffect(() => {
        // Fetch dashboard stats
        Promise.all([
            fetch('/api/dashboard').then(res => res.json()),
            fetch('/api/activity?limit=5').then(res => res.json()),
        ])
            .then(([dashData, actData]) => {
                // Handle case where API returns error object
                if (dashData && !dashData.error) {
                    setStats(dashData);
                }
                setActivity(actData?.data && Array.isArray(actData.data) ? actData.data : []);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return language === 'ar' ? 'صباح الخير' : 'Good morning';
        if (hour < 18) return language === 'ar' ? 'مساء الخير' : 'Good afternoon';
        return language === 'ar' ? 'مساء الخير' : 'Good evening';
    };

    const getDaysUntil = (date: string): number => {
        const endDate = new Date(date);
        endDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = endDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatAction = (action: string): string => {
        const actionMap: Record<string, { en: string; ar: string }> = {
            'subscriber.created': { en: 'Added subscriber', ar: 'تمت إضافة مشترك' },
            'subscription.created': { en: 'Created subscription', ar: 'تم إنشاء اشتراك' },
            'subscription.marked_paid': { en: 'Marked as paid', ar: 'تم وضع علامة مدفوع' },
            'payment.recorded': { en: 'Recorded payment', ar: 'تم تسجيل دفعة' },
            'plan.created': { en: 'Created plan', ar: 'تم إنشاء خطة' },
            'user.login': { en: 'User logged in', ar: 'تسجيل دخول المستخدم' },
        };
        return actionMap[action]?.[language] || action;
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <span>{t('common.loading')}</span>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            {/* Welcome Banner */}
            <section className={styles.welcome}>
                <div className={styles.welcomeContent}>
                    <h1 className={styles.welcomeTitle}>
                        {getGreeting()} 👋
                    </h1>
                    <p className={styles.welcomeText}>{t('dashboard.overview')}</p>
                </div>
                <div className={styles.welcomeDecor}></div>
            </section>

            {/* Stats Grid */}
            <section className={styles.statsGrid}>
                <StatCard
                    icon={
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    }
                    label={t('dashboard.totalSubscribers')}
                    value={stats?.totalSubscribers?.toLocaleString() || '0'}
                    trend="+12%"
                    trendUp={true}
                />
                <StatCard
                    icon={
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    }
                    label={t('dashboard.activeSubscriptions')}
                    value={stats?.activeSubscriptions?.toLocaleString() || '0'}
                    trend="+8%"
                    trendUp={true}
                />
                <StatCard
                    icon={
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    }
                    label={t('dashboard.monthlyRevenue')}
                    value={formatIQD(stats?.monthlyRevenue || 0, language)}
                    isRevenue={true}
                    showValue={showRevenue}
                    onToggleVisibility={() => setShowRevenue(!showRevenue)}
                />
                <StatCard
                    icon={
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                        </svg>
                    }
                    label={t('dashboard.unpaidCount')}
                    value={stats?.unpaidCount?.toLocaleString() || '0'}
                    trend={stats?.unpaidCount && stats.unpaidCount > 0 ? `${stats.unpaidCount} pending` : undefined}
                    trendUp={false}
                />
            </section>

            {/* Quick Actions */}
            <section className={styles.quickActions}>
                <h2 className={styles.sectionTitle}>{t('dashboard.quickActions')}</h2>
                <div className={styles.actionButtons}>
                    <Link href="/dashboard/subscribers/new" className={styles.actionBtn}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <line x1="20" y1="8" x2="20" y2="14" />
                            <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        <span>{t('dashboard.addSubscriber')}</span>
                    </Link>
                    <Link href="/dashboard/subscriptions/new" className={styles.actionBtn}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <span>{t('dashboard.newSubscription')}</span>
                    </Link>
                    <Link href="/dashboard/unpaid" className={styles.actionBtn}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                        </svg>
                        <span>{t('dashboard.reviewUnpaid')}</span>
                    </Link>
                </div>
            </section>

            {/* Two Column Layout */}
            <div className={styles.twoColumn}>
                {/* Expiring Soon */}
                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.sectionTitle}>{t('dashboard.expiringSoon')}</h2>
                        <Link href="/dashboard/subscriptions?filter=expiring" className={styles.viewAll}>
                            {language === 'ar' ? 'عرض الكل' : 'View all'} →
                        </Link>
                    </div>
                    <div className={styles.cardContent}>
                        {stats?.expiringSubscriptions && stats.expiringSubscriptions.length > 0 ? (
                            <div className={styles.expiringList}>
                                {stats.expiringSubscriptions.map((sub) => {
                                    const daysLeft = getDaysUntil(sub.end_date);
                                    return (
                                        <div key={sub.id} className={styles.expiringItem}>
                                            <div className={styles.expiringInfo}>
                                                <span className={styles.expiringName}>
                                                    {sub.subscriber?.name || 'Unknown'}
                                                </span>
                                                <span className={styles.expiringPlan}>
                                                    {sub.plan?.name || 'Custom'}
                                                </span>
                                            </div>
                                            <div className={styles.expiringMeta}>
                                                <span className={`${styles.expiringDays} ${daysLeft <= 3 ? styles.urgent : ''}`}>
                                                    {t('dashboard.expiresIn')} {daysLeft} {t('dashboard.days')}
                                                </span>
                                                <span className={styles.expiringPrice}>
                                                    {formatIQD(sub.price, language)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                                </svg>
                                <p>{t('dashboard.noExpiring')}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Recent Activity */}
                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.sectionTitle}>{t('dashboard.recentActivity')}</h2>
                        <Link href="/dashboard/activity" className={styles.viewAll}>
                            {language === 'ar' ? 'عرض الكل' : 'View all'} →
                        </Link>
                    </div>
                    <div className={styles.cardContent}>
                        {activity.length > 0 ? (
                            <div className={styles.activityList}>
                                {activity.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={styles.activityItem}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className={styles.activityDot}></div>
                                        <div className={styles.activityContent}>
                                            <span className={styles.activityAction}>
                                                {formatAction(item.action)}
                                            </span>
                                            <span className={styles.activityTime}>
                                                {formatDate(item.created_at, language)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <p>{t('dashboard.noActivity')}</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
