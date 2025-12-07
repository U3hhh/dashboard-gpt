'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import styles from './page.module.css';

interface MonthlyData {
    month: string;
    revenue: number;
    subscriptions: number;
    newSubscribers: number;
}

interface AnalyticsData {
    revenue: {
        labels: string[];
        data: number[];
    };
    subscriptions: {
        active: number;
        expired: number;
        cancelled: number;
        pending: number;
    };
    subscribers: {
        total: number;
        active: number;
        inactive: number;
    };
    trends: {
        date: string;
        revenue: number;
        subscriptions: number;
        subscribers: number;
    }[];
}

export default function AnalyticsPage() {
    const { language } = useLanguage();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/analytics?period=year');
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const t = {
        title: language === 'ar' ? 'التحليلات' : 'Analytics',
        subtitle: language === 'ar' ? 'نظرة عامة على أداء الأعمال' : 'Business performance overview',
        revenue: language === 'ar' ? 'الإيرادات' : 'Revenue',
        subscriptions: language === 'ar' ? 'الاشتراكات' : 'Subscriptions',
        newSubscribers: language === 'ar' ? 'مشتركين جدد' : 'New Subscribers',
        totalRevenue: language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
        avgRevenue: language === 'ar' ? 'متوسط الإيرادات الشهرية' : 'Avg Monthly Revenue',
        totalSubscribers: language === 'ar' ? 'إجمالي المشتركين الجدد' : 'Total New Subscribers',
        monthlyTrend: language === 'ar' ? 'الاتجاه الشهري' : 'Monthly Trend',
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    if (!data) return null;

    const totalRevenue = data.revenue.data.reduce((a, b) => a + b, 0);
    const avgRevenue = data.revenue.data.length > 0 ? totalRevenue / data.revenue.data.length : 0;
    const maxRevenue = Math.max(...data.revenue.data, 1); // Avoid division by zero

    const formatMonth = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>{t.title}</h1>
                <p className={styles.subtitle}>{t.subtitle}</p>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>{t.totalRevenue}</span>
                        <span className={styles.statValue}>{totalRevenue.toLocaleString()} IQD</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2">
                            <path d="M18 20V10M12 20V4M6 20v-6" />
                        </svg>
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>{t.avgRevenue}</span>
                        <span className={styles.statValue}>{Math.round(avgRevenue).toLocaleString()} IQD</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>{t.totalSubscribers}</span>
                        <span className={styles.statValue}>{data.subscribers.total}</span>
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className={styles.chartCard}>
                <h2 className={styles.chartTitle}>{t.monthlyTrend} - {t.revenue}</h2>
                <div className={styles.chart}>
                    {data.revenue.data.map((amount, index) => (
                        <div key={index} className={styles.chartBar}>
                            <div className={styles.barContainer}>
                                <div
                                    className={styles.bar}
                                    style={{
                                        height: `${(amount / maxRevenue) * 100}%`,
                                    }}
                                >
                                    <span className={styles.barValue}>
                                        {(amount / 1000).toFixed(0)}K
                                    </span>
                                </div>
                            </div>
                            <span className={styles.barLabel}>{formatMonth(data.revenue.labels[index])}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Monthly Data Table */}
            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>{language === 'ar' ? 'الشهر' : 'Month'}</th>
                            <th>{t.revenue}</th>
                            <th>{t.subscriptions}</th>
                            <th>{t.newSubscribers}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.trends.map((item, index) => (
                            <tr key={index}>
                                <td style={{ fontWeight: 600 }}>{formatMonth(item.date)}</td>
                                <td style={{ color: 'var(--color-primary-light)' }}>{item.revenue.toLocaleString()} IQD</td>
                                <td>{item.subscriptions}</td>
                                <td style={{ color: 'var(--color-success)' }}>+{item.subscribers}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
