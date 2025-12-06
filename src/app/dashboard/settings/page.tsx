'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import styles from './page.module.css';

interface Organization {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
}

export default function SettingsPage() {
    const { t, language, setLanguage } = useLanguage();
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetch('/api/settings/organization')
            .then(res => res.json())
            .then((data) => {
                setOrg(data);
                setOrgName(data.name || '');
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/settings/organization', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: orgName }),
            });

            if (res.ok) {
                setMessage({
                    type: 'success',
                    text: language === 'ar' ? 'تم الحفظ بنجاح' : 'Settings saved successfully'
                });
            } else {
                throw new Error('Failed to save');
            }
        } catch {
            setMessage({
                type: 'error',
                text: language === 'ar' ? 'فشل في الحفظ' : 'Failed to save settings'
            });
        }
        setSaving(false);
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
            <h1 className={styles.title}>{t('nav.settings')}</h1>

            {/* Organization Settings */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    {language === 'ar' ? 'إعدادات المؤسسة' : 'Organization Settings'}
                </h2>
                <form onSubmit={handleSave} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            {language === 'ar' ? 'اسم المؤسسة' : 'Organization Name'}
                        </label>
                        <input
                            type="text"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.saveBtn} disabled={saving}>
                        {saving
                            ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                            : t('common.save')
                        }
                    </button>

                    {message && (
                        <div className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>
                            {message.text}
                        </div>
                    )}
                </form>
            </section>

            {/* Language Settings */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    {language === 'ar' ? 'إعدادات اللغة' : 'Language Settings'}
                </h2>
                <div className={styles.languageOptions}>
                    <button
                        className={`${styles.langBtn} ${language === 'en' ? styles.active : ''}`}
                        onClick={() => setLanguage('en')}
                    >
                        <span className={styles.langFlag}>🇺🇸</span>
                        <span>English</span>
                    </button>
                    <button
                        className={`${styles.langBtn} ${language === 'ar' ? styles.active : ''}`}
                        onClick={() => setLanguage('ar')}
                    >
                        <span className={styles.langFlag}>🇮🇶</span>
                        <span>العربية</span>
                    </button>
                </div>
            </section>

            {/* Account Info */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    {language === 'ar' ? 'معلومات الحساب' : 'Account Information'}
                </h2>
                <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>
                            {language === 'ar' ? 'معرف المؤسسة' : 'Organization ID'}
                        </span>
                        <span className={styles.infoValue}>{org?.id}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>
                            {language === 'ar' ? 'الحالة' : 'Status'}
                        </span>
                        <span className={`${styles.statusBadge} ${org?.is_active ? styles.active : ''}`}>
                            {org?.is_active
                                ? (language === 'ar' ? 'نشط' : 'Active')
                                : (language === 'ar' ? 'غير نشط' : 'Inactive')
                            }
                        </span>
                    </div>
                </div>
            </section>
        </div>
    );
}
