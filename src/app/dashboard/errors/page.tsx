'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import styles from '../activity/page.module.css'; // Reuse activity styles

interface ErrorLog {
    id: string;
    message: string;
    stack: string | null;
    url: string | null;
    user_agent: string | null;
    created_at: string;
    users: {
        name: string;
        email: string;
    } | null;
}

export default function ErrorsPage() {
    const { language } = useLanguage();
    const [logs, setLogs] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);

    const t = {
        title: language === 'ar' ? 'سجل الأخطاء' : 'Error Logs',
        subtitle: language === 'ar' ? 'تتبع أخطاء النظام' : 'Track system errors',
        user: language === 'ar' ? 'المستخدم' : 'User',
        message: language === 'ar' ? 'الرسالة' : 'Message',
        url: language === 'ar' ? 'الرابط' : 'URL',
        time: language === 'ar' ? 'الوقت' : 'Time',
        noLogs: language === 'ar' ? 'لا توجد أخطاء مسجلة' : 'No error logs found',
    };

    useEffect(() => {
        fetch('/api/errors')
            .then(res => res.json())
            .then(data => {
                setLogs(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch errors:', err);
                setLoading(false);
            });
    }, []);

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
                            <th>{t.message}</th>
                            <th>{t.url}</th>
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
                                                background: 'var(--color-danger)', color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '12px'
                                            }}>
                                                {log.users?.name?.charAt(0).toUpperCase() || '!'}
                                            </div>
                                            <span>{log.users?.name || 'Anonymous'}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--color-danger)', fontWeight: 500 }}>
                                        {log.message}
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                                        {log.url || '-'}
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
