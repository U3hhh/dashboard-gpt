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

const mockData: MonthlyData[] = [
    { month: '2024-07', revenue: 450000, subscriptions: 18, newSubscribers: 5 },
    { month: '2024-08', revenue: 525000, subscriptions: 21, newSubscribers: 7 },
    { month: '2024-09', revenue: 600000, subscriptions: 24, newSubscribers: 6 },
    { month: '2024-10', revenue: 575000, subscriptions: 23, newSubscribers: 4 },
    { month: '2024-11', revenue: 725000, subscriptions: 29, newSubscribers: 8 },
    { month: '2024-12', revenue: 685000, subscriptions: 27, newSubscribers: 3 },
];

export default function AnalyticsPage() {
    const { language } = useLanguage();
    const [data, setData] = useState<MonthlyData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setData(mockData);
            setLoading(false);
        }, 500);
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

    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0;
    const totalNewSubs = data.reduce((sum, d) => sum + d.newSubscribers, 0);
    const maxRevenue = Math.max(...data.map(d => d.revenue));

    const formatMonth = (monthStr: string) => {
        const date = new Date(monthStr + '-01');
        return date.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', { month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

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
                        <span className={styles.statValue}>{totalNewSubs}</span>
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className={styles.chartCard}>
                <h2 className={styles.chartTitle}>{t.monthlyTrend} - {t.revenue}</h2>
                <div className={styles.chart}>
                    {data.map((item, index) => (
                        <div key={index} className={styles.chartBar}>
                            <div className={styles.barContainer}>
                                <div
                                    className={styles.bar}
                                    style={{
                                        height: `${(item.revenue / maxRevenue) * 100}%`,
                                    }}
                                >
                                    <span className={styles.barValue}>
                                        {(item.revenue / 1000).toFixed(0)}K
                                    </span>
                                </div>
                            </div>
                            <span className={styles.barLabel}>{formatMonth(item.month)}</span>
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
                        {data.map((item, index) => (
                            <tr key={index}>
                                <td style={{ fontWeight: 600 }}>{formatMonth(item.month)}</td>
                                <td style={{ color: 'var(--color-primary-light)' }}>{item.revenue.toLocaleString()} IQD</td>
                                <td>{item.subscriptions}</td>
                                <td style={{ color: 'var(--color-success)' }}>+{item.newSubscribers}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
