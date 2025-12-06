'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import styles from './page.module.css';

interface Plan {
    id: string;
    name: string;
    price: number;
    period_value: number;
    period_unit: string;
}

export default function NewSubscriptionPage() {
    const router = useRouter();
    const { language } = useLanguage();

    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        subscriber_name: '',
        phone: '',
        plan_id: '',
        price: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        status: 'active',
        payment_status: 'unpaid',
    });

    useEffect(() => {
        // Fetch plans only
        fetch('/api/plans')
            .then(res => res.json())
            .then((plansData) => {
                setPlans(Array.isArray(plansData) ? plansData : []);
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load plans');
                setLoading(false);
            });
    }, []);

    // Recalculate end date when start date or plan changes
    const calculateEndDate = (startDateStr: string, planId: string) => {
        if (!planId) return '';
        const plan = plans.find(p => p.id === planId);
        if (!plan) return '';

        const startDate = new Date(startDateStr);
        let endDate = new Date(startDate);

        switch (plan.period_unit) {
            case 'day':
                endDate.setDate(endDate.getDate() + plan.period_value);
                break;
            case 'week':
                endDate.setDate(endDate.getDate() + (plan.period_value * 7));
                break;
            case 'month':
                endDate.setMonth(endDate.getMonth() + plan.period_value);
                break;
            case 'year':
                endDate.setFullYear(endDate.getFullYear() + plan.period_value);
                break;
        }

        return endDate.toISOString().split('T')[0];
    };

    const handlePlanChange = (planId: string) => {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            const endDate = calculateEndDate(formData.start_date, planId);
            setFormData({
                ...formData,
                plan_id: planId,
                price: plan.price.toString(),
                end_date: endDate,
            });
        } else {
            setFormData({
                ...formData,
                plan_id: '',
            });
        }
    };

    const handleStartDateChange = (startDate: string) => {
        const endDate = formData.plan_id ? calculateEndDate(startDate, formData.plan_id) : formData.end_date;
        setFormData({
            ...formData,
            start_date: startDate,
            end_date: endDate,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            // First, create the subscriber
            const subscriberRes = await fetch('/api/subscribers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.subscriber_name,
                    phone: formData.phone || null,
                }),
            });

            if (!subscriberRes.ok) {
                const subErr = await subscriberRes.json();
                setError(subErr.message || 'Failed to create subscriber');
                setSaving(false);
                return;
            }

            const subscriber = await subscriberRes.json();

            // Then create the subscription
            const subscriptionRes = await fetch('/api/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriber_id: subscriber.id,
                    plan_id: formData.plan_id || null,
                    price: parseFloat(formData.price),
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    status: formData.status,
                    payment_status: formData.payment_status,
                }),
            });

            if (subscriptionRes.ok) {
                router.push('/dashboard/subscriptions');
            } else {
                const data = await subscriptionRes.json();
                setError(data.message || 'Failed to create subscription');
            }
        } catch {
            setError('An error occurred');
        }
        setSaving(false);
    };

    const t = {
        title: language === 'ar' ? 'اشتراك جديد' : 'New Subscription',
        subscriberName: language === 'ar' ? 'اسم المشترك' : 'Subscriber Name',
        enterName: language === 'ar' ? 'أدخل اسم المشترك' : 'Enter subscriber name',
        phone: language === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone Number (optional)',
        plan: language === 'ar' ? 'الخطة' : 'Plan',
        selectPlan: language === 'ar' ? 'اختر خطة (اختياري)' : 'Select plan (optional)',
        price: language === 'ar' ? 'السعر (IQD)' : 'Price (IQD)',
        startDate: language === 'ar' ? 'تاريخ البدء' : 'Start Date',
        endDate: language === 'ar' ? 'تاريخ الانتهاء' : 'End Date',
        status: language === 'ar' ? 'الحالة' : 'Status',
        paymentStatus: language === 'ar' ? 'حالة الدفع' : 'Payment Status',
        active: language === 'ar' ? 'نشط' : 'Active',
        pending: language === 'ar' ? 'معلق' : 'Pending',
        paid: language === 'ar' ? 'مدفوع' : 'Paid',
        unpaid: language === 'ar' ? 'غير مدفوع' : 'Unpaid',
        save: language === 'ar' ? 'إنشاء اشتراك' : 'Create Subscription',
        saving: language === 'ar' ? 'جاري الحفظ...' : 'Saving...',
        cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
        autoCalculated: language === 'ar' ? '(يحسب تلقائياً من الخطة)' : '(Auto-calculated from plan)',
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
            <h1 className={styles.title}>{t.title}</h1>

            {error && (
                <div className={styles.error}>{error}</div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Subscriber Name */}
                <div className={styles.field}>
                    <label className={styles.label}>{t.subscriberName} *</label>
                    <input
                        type="text"
                        value={formData.subscriber_name}
                        onChange={(e) => setFormData({ ...formData, subscriber_name: e.target.value })}
                        className={styles.input}
                        placeholder={t.enterName}
                        required
                    />
                </div>

                {/* Phone (optional) */}
                <div className={styles.field}>
                    <label className={styles.label}>{t.phone}</label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={styles.input}
                        placeholder="+964 7xx xxx xxxx"
                    />
                </div>

                {/* Plan */}
                <div className={styles.field}>
                    <label className={styles.label}>{t.plan}</label>
                    <select
                        value={formData.plan_id}
                        onChange={(e) => handlePlanChange(e.target.value)}
                        className={styles.select}
                    >
                        <option value="">{t.selectPlan}</option>
                        {plans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                                {plan.name} - {plan.price.toLocaleString()} IQD / {plan.period_value} {plan.period_unit}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Price */}
                <div className={styles.field}>
                    <label className={styles.label}>{t.price} *</label>
                    <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className={styles.input}
                        placeholder="0"
                        required
                        min="0"
                    />
                </div>

                {/* Dates */}
                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label}>{t.startDate} *</label>
                        <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>
                            {t.endDate} *
                            {formData.plan_id && (
                                <span style={{ fontSize: '0.75rem', opacity: 0.7, marginInlineStart: '0.5rem' }}>
                                    {t.autoCalculated}
                                </span>
                            )}
                        </label>
                        <input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            className={styles.input}
                            required
                            readOnly={!!formData.plan_id}
                            style={{ opacity: formData.plan_id ? 0.7 : 1 }}
                        />
                    </div>
                </div>

                {/* Status */}
                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label}>{t.status}</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className={styles.select}
                        >
                            <option value="active">{t.active}</option>
                            <option value="pending">{t.pending}</option>
                        </select>
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>{t.paymentStatus}</label>
                        <select
                            value={formData.payment_status}
                            onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                            className={styles.select}
                        >
                            <option value="unpaid">{t.unpaid}</option>
                            <option value="paid">{t.paid}</option>
                        </select>
                    </div>
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
