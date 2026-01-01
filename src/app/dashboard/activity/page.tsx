'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import styles from './page.module.css';

interface ActivityLog {
    id: string;
    action: string;
    entity_type: string;
    details: any;
    created_at: string;
    users: {
        name: string;
        email: string;
    } | null;
}

export default function ActivityPage() {
    const { language } = useLanguage();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    const t = {
        title: language === 'ar' ? 'سجل النشاطات' : 'Activity Logs',
        subtitle: language === 'ar' ? 'تتبع جميع الإجراءات في النظام' : 'Track all actions in the system',
        user: language === 'ar' ? 'المستخدم' : 'User',
        action: language === 'ar' ? 'الإجراء' : 'Action',
        details: language === 'ar' ? 'التفاصيل' : 'Details',
        time: language === 'ar' ? 'الوقت' : 'Time',
        noLogs: language === 'ar' ? 'لا توجد نشاطات مسجلة' : 'No activity logs found',
    };

    useEffect(() => {
        fetch('/api/activity')
            .then(res => res.json())
            .then(data => {
                setLogs(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch activity:', err);
                setLoading(false);
            });
    }, []);

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
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
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t.title}</h1>
                    <p className={styles.subtitle}>{t.subtitle}</p>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>{t.time}</th>
                            <th>{t.user}</th>
                            <th>{t.action}</th>
                            <th>{t.details}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                                    {t.noLogs}
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id}>
                                    <td style={{ whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                background: 'var(--color-primary)', color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '12px'
                                            }}>
                                                {log.users?.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <span>{log.users?.name || 'System'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.badge}>
                                            {formatAction(log.action)}
                                        </span>
                                    </td>
                                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {log.details ? JSON.stringify(log.details) : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
