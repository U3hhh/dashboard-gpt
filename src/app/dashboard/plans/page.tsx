'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import styles from '../subscriptions/page.module.css';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    period_value: number;
    period_unit: 'day' | 'week' | 'month' | 'year';
    is_active: boolean;
}

export default function PlansPage() {
    const { language } = useLanguage();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        period_value: '1',
        period_unit: 'month' as Plan['period_unit'],
    });

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/plans');
            if (res.ok) {
                const data = await res.json();
                setPlans(data);
            }
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const t = {
        title: language === 'ar' ? 'الخطط' : 'Plans',
        subtitle: language === 'ar' ? 'إدارة خطط الاشتراك' : 'Manage subscription plans',
        addPlan: language === 'ar' ? 'إضافة خطة' : 'Add Plan',
        name: language === 'ar' ? 'اسم الخطة' : 'Plan Name',
        description: language === 'ar' ? 'الوصف' : 'Description',
        price: language === 'ar' ? 'السعر (IQD)' : 'Price (IQD)',
        period: language === 'ar' ? 'المدة' : 'Period',
        status: language === 'ar' ? 'الحالة' : 'Status',
        actions: language === 'ar' ? 'الإجراءات' : 'Actions',
        active: language === 'ar' ? 'نشط' : 'Active',
        inactive: language === 'ar' ? 'غير نشط' : 'Inactive',
        edit: language === 'ar' ? 'تعديل' : 'Edit',
        deactivate: language === 'ar' ? 'تعطيل' : 'Deactivate',
        activate: language === 'ar' ? 'تفعيل' : 'Activate',
        save: language === 'ar' ? 'حفظ' : 'Save',
        cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
        newPlan: language === 'ar' ? 'خطة جديدة' : 'New Plan',
        editPlan: language === 'ar' ? 'تعديل الخطة' : 'Edit Plan',
        day: language === 'ar' ? 'يوم' : 'day',
        week: language === 'ar' ? 'أسبوع' : 'week',
        month: language === 'ar' ? 'شهر' : 'month',
        year: language === 'ar' ? 'سنة' : 'year',
        days: language === 'ar' ? 'أيام' : 'days',
        weeks: language === 'ar' ? 'أسابيع' : 'weeks',
        months: language === 'ar' ? 'أشهر' : 'months',
        years: language === 'ar' ? 'سنوات' : 'years',
    };

    const periodLabels: Record<string, string> = {
        day: t.day,
        week: t.week,
        month: t.month,
        year: t.year,
    };

    const formatPeriod = (value: number, unit: string) => {
        const plural = value > 1;
        if (language === 'ar') {
            return `${value} ${plural ? (unit === 'day' ? t.days : unit === 'week' ? t.weeks : unit === 'month' ? t.months : t.years) : periodLabels[unit]}`;
        }
        return `${value} ${unit}${plural ? 's' : ''}`;
    };

    const handleAddPlan = () => {
        setEditingPlan(null);
        setFormData({ name: '', description: '', price: '', period_value: '1', period_unit: 'month' });
        setShowModal(true);
    };

    const handleEditPlan = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            description: plan.description,
            price: plan.price.toString(),
            period_value: plan.period_value.toString(),
            period_unit: plan.period_unit,
        });
        setShowModal(true);
    };

    const handleToggleStatus = async (plan: Plan) => {
        try {
            const res = await fetch(`/api/plans/${plan.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !plan.is_active }),
            });

            if (res.ok) {
                const updatedPlan = await res.json();
                setPlans(plans.map(p => p.id === plan.id ? updatedPlan : p));
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الخطة؟' : 'Are you sure you want to delete this plan?')) return;

        try {
            const res = await fetch(`/api/plans/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setPlans(plans.filter(p => p.id !== id));
            } else {
                alert('Failed to delete plan');
            }
        } catch (error) {
            console.error('Failed to delete plan:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                period_value: parseInt(formData.period_value),
                period_unit: formData.period_unit,
            };

            let res;
            if (editingPlan) {
                res = await fetch(`/api/plans/${editingPlan.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch('/api/plans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            if (res.ok) {
                await fetchPlans(); // Refresh list
                setShowModal(false);
            }
        } catch (error) {
            console.error('Failed to save plan:', error);
        }
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
                <div>
                    <h1 className={styles.title}>{t.title}</h1>
                    <p className={styles.subtitle}>{t.subtitle}</p>
                </div>
                <button className={styles.addBtn} onClick={handleAddPlan}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {t.addPlan}
                </button>
            </div>

            {/* Plans Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>{t.name}</th>
                            <th>{t.description}</th>
                            <th>{t.price}</th>
                            <th>{t.period}</th>
                            <th>{t.status}</th>
                            <th>{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map((plan) => (
                            <tr key={plan.id}>
                                <td style={{ fontWeight: 600 }}>{plan.name}</td>
                                <td style={{ color: 'var(--color-text-muted)' }}>{plan.description}</td>
                                <td className={styles.price}>{plan.price.toLocaleString()} IQD</td>
                                <td>{formatPeriod(plan.period_value, plan.period_unit)}</td>
                                <td>
                                    <span className={`${styles.badge} ${plan.is_active ? styles.badgeSuccess : styles.badgeMuted}`}>
                                        {plan.is_active ? t.active : t.inactive}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className={styles.viewBtn}
                                            onClick={() => handleEditPlan(plan)}
                                        >
                                            {t.edit}
                                        </button>
                                        <button
                                            className={styles.viewBtn}
                                            onClick={() => handleToggleStatus(plan)}
                                            style={{ color: plan.is_active ? 'var(--color-danger)' : 'var(--color-success)' }}
                                        >
                                            {plan.is_active ? t.deactivate : t.activate}
                                        </button>
                                        <button
                                            className={styles.viewBtn}
                                            onClick={() => handleDeletePlan(plan.id)}
                                            style={{ color: 'var(--color-danger)' }}
                                            title={language === 'ar' ? 'حذف' : 'Delete'}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>
                            {editingPlan ? t.editPlan : t.newPlan}
                        </h2>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.modalField}>
                                <label>{t.name} *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.modalField}>
                                <label>{t.description}</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className={styles.modalField}>
                                <label>{t.price} *</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                    min="0"
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className={styles.modalField}>
                                    <label>{t.period}</label>
                                    <input
                                        type="number"
                                        value={formData.period_value}
                                        onChange={(e) => setFormData({ ...formData, period_value: e.target.value })}
                                        min="1"
                                    />
                                </div>
                                <div className={styles.modalField}>
                                    <label>&nbsp;</label>
                                    <select
                                        value={formData.period_unit}
                                        onChange={(e) => setFormData({ ...formData, period_unit: e.target.value as Plan['period_unit'] })}
                                    >
                                        <option value="day">{t.day}</option>
                                        <option value="week">{t.week}</option>
                                        <option value="month">{t.month}</option>
                                        <option value="year">{t.year}</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                                    {t.cancel}
                                </button>
                                <button type="submit" className={styles.saveBtn}>
                                    {t.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
