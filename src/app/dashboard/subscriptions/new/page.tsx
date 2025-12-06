'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import { useSettings } from '@/lib/settings-context';
import DateInputWithPicker from '@/components/DateInputWithPicker';
import styles from './page.module.css';

interface Plan {
    id: string;
    name: string;
    price: number;
    period_value: number;
    period_unit: string;
}

function NewSubscriptionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const subscriberId = searchParams.get('subscriberId');
    const { language } = useLanguage();
    const { dateInputType } = useSettings();

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

    // Helper to calculate end date
    const calculateEndDate = (startDateStr: string, planId: string, currentPlans: Plan[]) => {
        if (!planId) return '';
        const plan = currentPlans.find(p => p.id === planId);
        if (!plan) return '';

        const startDate = new Date(startDateStr);
        let endDate = new Date(startDate);
        const value = Number(plan.period_value);

        switch (plan.period_unit) {
            case 'day':
                endDate.setDate(endDate.getDate() + value);
                break;
            case 'week':
                endDate.setDate(endDate.getDate() + (value * 7));
                break;
            case 'month':
                endDate.setMonth(endDate.getMonth() + value);
                break;
            case 'year':
                endDate.setFullYear(endDate.getFullYear() + value);
                break;
        }

        return endDate.toISOString().split('T')[0];
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Fetch Plans
                const plansRes = await fetch('/api/plans');
                const plansData = await plansRes.json();
                const loadedPlans = Array.isArray(plansData) ? plansData : [];
                setPlans(loadedPlans);

                // 2. If subscriberId exists, fetch subscriber details for autofill
                if (subscriberId) {
                    const subRes = await fetch(`/api/subscribers/${subscriberId}`);
                    if (subRes.ok) {
                        const subData = await subRes.json();

                        // Find latest subscription if exists
                        const latestSub = subData.subscriptions && subData.subscriptions.length > 0
                            ? subData.subscriptions[0]
                            : null;

                        console.log('Latest Subscription:', latestSub);
                        console.log('Loaded Plans:', loadedPlans);

                        let newFormData = {
                            ...formData,
                            subscriber_name: subData.name || '',
                            phone: subData.phone || '',
                        };

                        // Autofill plan details if available
                        if (latestSub && latestSub.plan_id) {
                            const planId = latestSub.plan_id;
                            const plan = loadedPlans.find((p: Plan) => p.id === planId);

                            console.log('Plan ID from Sub:', planId);
                            console.log('Found Plan:', plan);

                            if (plan) {
                                // Calculate new end date based on TODAY's start date
                                const endDate = calculateEndDate(formData.start_date, planId, loadedPlans);

                                newFormData = {
                                    ...newFormData,
                                    plan_id: planId,
                                    price: plan.price.toString(),
                                    end_date: endDate,
                                };
                            }
                        }

                        setFormData(newFormData);
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load data');
                setLoading(false);
            }
        };

        loadData();
    }, [subscriberId]); // Depend on subscriberId to re-run if URL changes

    const handlePlanChange = (planId: string) => {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            const endDate = calculateEndDate(formData.start_date, planId, plans);
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
        const endDate = formData.plan_id ? calculateEndDate(startDate, formData.plan_id, plans) : formData.end_date;
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
            let subscriber_id = subscriberId;

            // If no subscriberId in URL, create new subscriber first
            if (!subscriber_id) {
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
                subscriber_id = subscriber.id;
            }

            // Create the subscription
            const subscriptionRes = await fetch('/api/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriber_id: subscriber_id,
                    plan_id: formData.plan_id || null,
                    price: parseFloat(formData.price),
                    start_date: formData.start_date.replace(/\//g, '-'),
                    end_date: formData.end_date.replace(/\//g, '-'),
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
                        readOnly={!!subscriberId} // Read-only if renewing
                        style={{ opacity: subscriberId ? 0.7 : 1 }}
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
                        readOnly={!!subscriberId} // Read-only if renewing
                        style={{ opacity: subscriberId ? 0.7 : 1 }}
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
                        {dateInputType === 'date' ? (
                            <input
                                type="date"
                                value={formData.start_date.replace(/\//g, '-')}
                                onChange={(e) => handleStartDateChange(e.target.value)}
                                className={styles.input}
                                required
                            />
                        ) : (
                            <DateInputWithPicker
                                value={formData.start_date}
                                onChange={(val) => handleStartDateChange(val)}
                                className={styles.input}
                                required
                            />
                        )}
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
                        {!!formData.plan_id ? (
                            <input
                                type="text"
                                value={formData.end_date.replace(/-/g, '/')}
                                className={styles.input}
                                readOnly
                                style={{ opacity: 0.7 }}
                            />
                        ) : dateInputType === 'date' ? (
                            <input
                                type="date"
                                value={formData.end_date.replace(/\//g, '-')}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className={styles.input}
                                required
                            />
                        ) : (
                            <DateInputWithPicker
                                value={formData.end_date}
                                onChange={(val) => setFormData({ ...formData, end_date: val })}
                                className={styles.input}
                                required
                            />
                        )}
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

export default function NewSubscriptionPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewSubscriptionContent />
        </Suspense>
    );
}
