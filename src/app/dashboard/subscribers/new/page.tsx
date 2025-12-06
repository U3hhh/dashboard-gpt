'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import styles from '../../subscriptions/new/page.module.css';

export default function NewSubscriberPage() {
    const router = useRouter();
    const { language } = useLanguage();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        is_active: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/subscribers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email || null,
                    phone: formData.phone || null,
                    address: formData.address || null,
                    is_active: formData.is_active,
                }),
            });

            if (res.ok) {
                router.push('/dashboard/subscribers');
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to create subscriber');
            }
        } catch {
            setError('An error occurred');
        }
        setSaving(false);
    };

    const t = {
        title: language === 'ar' ? 'مشترك جديد' : 'New Subscriber',
        name: language === 'ar' ? 'الاسم' : 'Name',
        email: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
        phone: language === 'ar' ? 'رقم الهاتف' : 'Phone',
        address: language === 'ar' ? 'العنوان' : 'Address',
        status: language === 'ar' ? 'الحالة' : 'Status',
        active: language === 'ar' ? 'نشط' : 'Active',
        inactive: language === 'ar' ? 'غير نشط' : 'Inactive',
        save: language === 'ar' ? 'إضافة مشترك' : 'Add Subscriber',
        saving: language === 'ar' ? 'جاري الحفظ...' : 'Saving...',
        cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
    };

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>{t.title}</h1>

            {error && (
                <div className={styles.error}>{error}</div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Name */}
                <div className={styles.field}>
                    <label className={styles.label}>{t.name} *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={styles.input}
                        placeholder={language === 'ar' ? 'أدخل الاسم' : 'Enter name'}
                        required
                    />
                </div>

                {/* Email */}
                <div className={styles.field}>
                    <label className={styles.label}>{t.email}</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={styles.input}
                        placeholder="email@example.com"
                    />
                </div>

                {/* Phone */}
                <div className={styles.field}>
                    <label className={styles.label}>{t.phone}</label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={styles.input}
                        placeholder="+964 xxx xxx xxxx"
                    />
                </div>

                {/* Address */}
                <div className={styles.field}>
                    <label className={styles.label}>{t.address}</label>
                    <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className={styles.input}
                        placeholder={language === 'ar' ? 'أدخل العنوان' : 'Enter address'}
                    />
                </div>

                {/* Status */}
                <div className={styles.field}>
                    <label className={styles.label}>{t.status}</label>
                    <select
                        value={formData.is_active ? 'active' : 'inactive'}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                        className={styles.select}
                    >
                        <option value="active">{t.active}</option>
                        <option value="inactive">{t.inactive}</option>
                    </select>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className={styles.cancelBtn}
                    >
                        {t.cancel}
                    </button>
                    <button
                        type="submit"
                        className={styles.saveBtn}
                        disabled={saving}
                    >
                        {saving ? t.saving : t.save}
                    </button>
                </div>
            </form>
        </div>
    );
}
