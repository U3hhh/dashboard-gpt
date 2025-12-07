'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import styles from '../subscriptions/page.module.css';

interface Invoice {
    id: string;
    invoice_number: string;
    subscription_id: string;
    subscriber_name: string;
    amount: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    due_date: string;
    paid_at: string | null;
    created_at: string;
    subscription?: {
        subscriber?: {
            name: string;
        }
    }
}

export default function InvoicesPage() {
    const { language } = useLanguage();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | Invoice['status']>('all');

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/api/invoices?limit=50');
            if (res.ok) {
                const data = await res.json();
                setInvoices(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const t = {
        title: language === 'ar' ? 'الفواتير' : 'Invoices',
        subtitle: language === 'ar' ? 'إدارة فواتير الاشتراكات' : 'Manage subscription invoices',
        invoiceNumber: language === 'ar' ? 'رقم الفاتورة' : 'Invoice #',
        subscriber: language === 'ar' ? 'المشترك' : 'Subscriber',
        amount: language === 'ar' ? 'المبلغ' : 'Amount',
        status: language === 'ar' ? 'الحالة' : 'Status',
        dueDate: language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date',
        paidAt: language === 'ar' ? 'تاريخ الدفع' : 'Paid At',
        actions: language === 'ar' ? 'الإجراءات' : 'Actions',
        all: language === 'ar' ? 'الكل' : 'All',
        draft: language === 'ar' ? 'مسودة' : 'Draft',
        sent: language === 'ar' ? 'مرسلة' : 'Sent',
        paid: language === 'ar' ? 'مدفوعة' : 'Paid',
        overdue: language === 'ar' ? 'متأخرة' : 'Overdue',
        cancelled: language === 'ar' ? 'ملغية' : 'Cancelled',
        markPaid: language === 'ar' ? 'تحديد كمدفوعة' : 'Mark Paid',
        send: language === 'ar' ? 'إرسال' : 'Send',
        view: language === 'ar' ? 'عرض' : 'View',
        notPaid: language === 'ar' ? 'غير مدفوعة' : 'Not paid',
    };

    const statusLabels: Record<Invoice['status'], string> = {
        draft: t.draft,
        sent: t.sent,
        paid: t.paid,
        overdue: t.overdue,
        cancelled: t.cancelled,
    };

    const statusStyles: Record<Invoice['status'], string> = {
        draft: styles.badgeMuted,
        sent: styles.badgeWarning,
        paid: styles.badgeSuccess,
        overdue: styles.badgeDanger,
        cancelled: styles.badgeMuted,
    };

    const filteredInvoices = filter === 'all'
        ? invoices
        : invoices.filter(inv => inv.status === filter);

    const handleMarkPaid = async (invoice: Invoice) => {
        // In a real app, this would likely involve creating a payment record
        // For now, we'll just update the invoice status locally as the API doesn't support direct status update via PUT yet
        // A proper implementation would use the payments API
        alert('To mark as paid, please record a payment in the Payments section.');
    };

    const handleSend = async (invoice: Invoice) => {
        // Simulate sending
        alert(`Invoice ${invoice.invoice_number} sent to subscriber.`);
        // Optimistic update
        setInvoices(invoices.map(inv =>
            inv.id === invoice.id ? { ...inv, status: 'sent' } : inv
        ));
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
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map((status) => (
                        <button
                            key={status}
                            className={`${styles.filterBtn} ${filter === status ? styles.active : ''}`}
                            onClick={() => setFilter(status)}
                        >
                            {status === 'all' ? t.all : statusLabels[status]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Invoices Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>{t.invoiceNumber}</th>
                            <th>{t.subscriber}</th>
                            <th>{t.amount}</th>
                            <th>{t.dueDate}</th>
                            <th>{t.paidAt}</th>
                            <th>{t.status}</th>
                            <th>{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.map((invoice) => (
                            <tr key={invoice.id}>
                                <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{invoice.invoice_number}</td>
                                <td>{invoice.subscription?.subscriber?.name || invoice.subscriber_name || 'Unknown'}</td>
                                <td className={styles.price}>{invoice.amount.toLocaleString()} IQD</td>
                                <td>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}</td>
                                <td style={{ color: invoice.paid_at ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                                    {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : t.notPaid}
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${statusStyles[invoice.status]}`}>
                                        {statusLabels[invoice.status]}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {invoice.status === 'draft' && (
                                            <button
                                                className={styles.viewBtn}
                                                onClick={() => handleSend(invoice)}
                                            >
                                                {t.send}
                                            </button>
                                        )}
                                        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                                            <button
                                                className={styles.viewBtn}
                                                onClick={() => handleMarkPaid(invoice)}
                                                style={{ color: 'var(--color-success)' }}
                                            >
                                                {t.markPaid}
                                            </button>
                                        )}
                                        <button className={styles.viewBtn}>
                                            {t.view}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
