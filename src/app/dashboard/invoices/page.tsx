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
}

const mockInvoices: Invoice[] = [
    { id: '1', invoice_number: 'INV-2024-00001', subscription_id: '1', subscriber_name: 'أحمد محمد', amount: 25000, status: 'paid', due_date: '2024-11-15', paid_at: '2024-11-14', created_at: '2024-11-01' },
    { id: '2', invoice_number: 'INV-2024-00002', subscription_id: '2', subscriber_name: 'سارة علي', amount: 50000, status: 'paid', due_date: '2024-11-20', paid_at: '2024-11-18', created_at: '2024-11-05' },
    { id: '3', invoice_number: 'INV-2024-00003', subscription_id: '3', subscriber_name: 'محمد حسن', amount: 25000, status: 'overdue', due_date: '2024-11-25', paid_at: null, created_at: '2024-11-10' },
    { id: '4', invoice_number: 'INV-2024-00004', subscription_id: '5', subscriber_name: 'علي عباس', amount: 50000, status: 'sent', due_date: '2024-12-10', paid_at: null, created_at: '2024-11-25' },
    { id: '5', invoice_number: 'INV-2024-00005', subscription_id: '8', subscriber_name: 'كريم صالح', amount: 10000, status: 'draft', due_date: '2024-12-15', paid_at: null, created_at: '2024-12-01' },
];

export default function InvoicesPage() {
    const { language } = useLanguage();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | Invoice['status']>('all');

    useEffect(() => {
        setTimeout(() => {
            setInvoices(mockInvoices);
            setLoading(false);
        }, 500);
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

    const handleMarkPaid = (invoice: Invoice) => {
        setInvoices(invoices.map(inv =>
            inv.id === invoice.id
                ? { ...inv, status: 'paid' as const, paid_at: new Date().toISOString().split('T')[0] }
                : inv
        ));
    };

    const handleSend = (invoice: Invoice) => {
        setInvoices(invoices.map(inv =>
            inv.id === invoice.id
                ? { ...inv, status: 'sent' as const }
                : inv
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
                                <td>{invoice.subscriber_name}</td>
                                <td className={styles.price}>{invoice.amount.toLocaleString()} IQD</td>
                                <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
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
