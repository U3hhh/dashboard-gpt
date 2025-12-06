'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import styles from '../subscriptions/page.module.css';

interface Payment {
    id: string;
    invoice_id: string;
    invoice_number: string;
    subscriber_name: string;
    amount: number;
    method: 'cash' | 'bank_transfer' | 'mobile_wallet' | 'card';
    reference: string | null;
    paid_at: string;
    recorded_by: string;
}

const mockPayments: Payment[] = [
    { id: '1', invoice_id: '1', invoice_number: 'INV-2024-00001', subscriber_name: 'أحمد محمد', amount: 25000, method: 'cash', reference: null, paid_at: '2024-11-14T10:30:00Z', recorded_by: 'admin@example.com' },
    { id: '2', invoice_id: '2', invoice_number: 'INV-2024-00002', subscriber_name: 'سارة علي', amount: 50000, method: 'bank_transfer', reference: 'TXN-12345', paid_at: '2024-11-18T14:20:00Z', recorded_by: 'admin@example.com' },
    { id: '3', invoice_id: '6', invoice_number: 'INV-2024-00006', subscriber_name: 'نور الدين', amount: 500000, method: 'mobile_wallet', reference: 'ZC-98765', paid_at: '2024-10-15T09:00:00Z', recorded_by: 'admin@example.com' },
    { id: '4', invoice_id: '7', invoice_number: 'INV-2024-00007', subscriber_name: 'زينب حسين', amount: 25000, method: 'cash', reference: null, paid_at: '2024-11-28T16:45:00Z', recorded_by: 'admin@example.com' },
];

export default function PaymentsPage() {
    const { language } = useLanguage();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        invoice_number: '',
        amount: '',
        method: 'cash' as Payment['method'],
        reference: '',
    });

    useEffect(() => {
        setTimeout(() => {
            setPayments(mockPayments);
            setLoading(false);
        }, 500);
    }, []);

    const t = {
        title: language === 'ar' ? 'المدفوعات' : 'Payments',
        subtitle: language === 'ar' ? 'سجل جميع المدفوعات' : 'Record of all payments',
        recordPayment: language === 'ar' ? 'تسجيل دفعة' : 'Record Payment',
        invoiceNumber: language === 'ar' ? 'رقم الفاتورة' : 'Invoice #',
        subscriber: language === 'ar' ? 'المشترك' : 'Subscriber',
        amount: language === 'ar' ? 'المبلغ' : 'Amount',
        method: language === 'ar' ? 'طريقة الدفع' : 'Method',
        reference: language === 'ar' ? 'المرجع' : 'Reference',
        paidAt: language === 'ar' ? 'تاريخ الدفع' : 'Paid At',
        recordedBy: language === 'ar' ? 'مسجل بواسطة' : 'Recorded By',
        cash: language === 'ar' ? 'نقداً' : 'Cash',
        bankTransfer: language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer',
        mobileWallet: language === 'ar' ? 'محفظة إلكترونية' : 'Mobile Wallet',
        card: language === 'ar' ? 'بطاقة' : 'Card',
        save: language === 'ar' ? 'حفظ' : 'Save',
        cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
        newPayment: language === 'ar' ? 'دفعة جديدة' : 'New Payment',
        noReference: language === 'ar' ? '-' : '-',
        totalPayments: language === 'ar' ? 'إجمالي المدفوعات' : 'Total Payments',
    };

    const methodLabels: Record<Payment['method'], string> = {
        cash: t.cash,
        bank_transfer: t.bankTransfer,
        mobile_wallet: t.mobileWallet,
        card: t.card,
    };

    const methodColors: Record<Payment['method'], string> = {
        cash: 'var(--color-success)',
        bank_transfer: 'var(--color-primary-light)',
        mobile_wallet: 'var(--color-warning)',
        card: 'var(--color-secondary)',
    };

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    const handleRecordPayment = () => {
        setFormData({ invoice_number: '', amount: '', method: 'cash', reference: '' });
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newPayment: Payment = {
            id: Date.now().toString(),
            invoice_id: Date.now().toString(),
            invoice_number: formData.invoice_number,
            subscriber_name: 'New Subscriber',
            amount: parseFloat(formData.amount),
            method: formData.method,
            reference: formData.reference || null,
            paid_at: new Date().toISOString(),
            recorded_by: 'admin@example.com',
        };
        setPayments([newPayment, ...payments]);
        setShowModal(false);
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
                <button className={styles.addBtn} onClick={handleRecordPayment}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {t.recordPayment}
                </button>
            </div>

            {/* Summary Card */}
            <div style={{
                padding: 'var(--space-5)',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                borderRadius: 'var(--radius-lg)',
                color: 'white',
                marginBottom: 'var(--space-4)'
            }}>
                <div style={{ fontSize: 'var(--text-sm)', opacity: 0.9 }}>{t.totalPayments}</div>
                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700 }}>
                    {totalAmount.toLocaleString()} IQD
                </div>
            </div>

            {/* Payments Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>{t.invoiceNumber}</th>
                            <th>{t.subscriber}</th>
                            <th>{t.amount}</th>
                            <th>{t.method}</th>
                            <th>{t.reference}</th>
                            <th>{t.paidAt}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment) => (
                            <tr key={payment.id}>
                                <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{payment.invoice_number}</td>
                                <td>{payment.subscriber_name}</td>
                                <td className={styles.price}>{payment.amount.toLocaleString()} IQD</td>
                                <td>
                                    <span style={{
                                        color: methodColors[payment.method],
                                        fontWeight: 600,
                                        fontSize: 'var(--text-sm)'
                                    }}>
                                        {methodLabels[payment.method]}
                                    </span>
                                </td>
                                <td style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                                    {payment.reference || t.noReference}
                                </td>
                                <td>{new Date(payment.paid_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>{t.newPayment}</h2>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.modalField}>
                                <label>{t.invoiceNumber} *</label>
                                <input
                                    type="text"
                                    value={formData.invoice_number}
                                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                                    placeholder="INV-2024-00001"
                                    required
                                />
                            </div>
                            <div className={styles.modalField}>
                                <label>{t.amount} *</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    min="0"
                                />
                            </div>
                            <div className={styles.modalField}>
                                <label>{t.method}</label>
                                <select
                                    value={formData.method}
                                    onChange={(e) => setFormData({ ...formData, method: e.target.value as Payment['method'] })}
                                >
                                    <option value="cash">{t.cash}</option>
                                    <option value="bank_transfer">{t.bankTransfer}</option>
                                    <option value="mobile_wallet">{t.mobileWallet}</option>
                                    <option value="card">{t.card}</option>
                                </select>
                            </div>
                            <div className={styles.modalField}>
                                <label>{t.reference}</label>
                                <input
                                    type="text"
                                    value={formData.reference}
                                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                    placeholder="TXN-12345"
                                />
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
