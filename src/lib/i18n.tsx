'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
    language: Language;
    direction: Direction;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

// Translations
const translations: Record<Language, Record<string, string>> = {
    en: {
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.subscriptions': 'Subscriptions',
        'nav.unpaid': 'Unpaid',
        'nav.subscribers': 'Subscribers',
        'nav.groups': 'Groups',
        'nav.plans': 'Plans',
        'nav.invoices': 'Invoices',
        'nav.payments': 'Payments',
        'nav.analytics': 'Analytics',
        'nav.activity': 'Activity Logs',
        'nav.errors': 'Error Logs',
        'nav.users': 'Users',
        'nav.settings': 'Settings',

        // Dashboard
        'dashboard.welcome': 'Welcome back',
        'dashboard.overview': 'Here\'s what\'s happening with your subscriptions today.',
        'dashboard.totalSubscribers': 'Total Subscribers',
        'dashboard.activeSubscriptions': 'Active Subscriptions',
        'dashboard.monthlyRevenue': 'Monthly Revenue',
        'dashboard.unpaidCount': 'Unpaid',
        'dashboard.quickActions': 'Quick Actions',
        'dashboard.addSubscriber': 'Add Subscriber',
        'dashboard.newSubscription': 'New Subscription',
        'dashboard.reviewUnpaid': 'Review Unpaid',
        'dashboard.expiringSoon': 'Expiring Soon',
        'dashboard.recentActivity': 'Recent Activity',
        'dashboard.expiresIn': 'Expires in',
        'dashboard.days': 'days',
        'dashboard.noExpiring': 'No subscriptions expiring soon',
        'dashboard.noActivity': 'No recent activity',

        // Common
        'common.search': 'Search...',
        'common.notifications': 'Notifications',
        'common.profile': 'Profile',
        'common.logout': 'Logout',
        'common.loading': 'Loading...',
        'common.error': 'An error occurred',
        'common.retry': 'Retry',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.view': 'View',
        'common.active': 'Active',
        'common.inactive': 'Inactive',
        'common.paid': 'Paid',
        'common.unpaid': 'Unpaid',
        'common.pending': 'Pending',
        'common.expired': 'Expired',
        'common.cancelled': 'Cancelled',

        // Stats
        'stats.increase': 'increase',
        'stats.decrease': 'decrease',
        'stats.fromLastMonth': 'from last month',
    },
    ar: {
        // Navigation
        'nav.dashboard': 'لوحة التحكم',
        'nav.subscriptions': 'الاشتراكات',
        'nav.unpaid': 'غير مدفوع',
        'nav.subscribers': 'المشتركين',
        'nav.groups': 'المجموعات',
        'nav.plans': 'الخطط',
        'nav.invoices': 'الفواتير',
        'nav.payments': 'المدفوعات',
        'nav.analytics': 'التحليلات',
        'nav.activity': 'سجل النشاط',
        'nav.errors': 'سجل الأخطاء',
        'nav.users': 'المستخدمين',
        'nav.settings': 'الإعدادات',

        // Dashboard
        'dashboard.welcome': 'مرحباً بعودتك',
        'dashboard.overview': 'إليك ما يحدث مع اشتراكاتك اليوم.',
        'dashboard.totalSubscribers': 'إجمالي المشتركين',
        'dashboard.activeSubscriptions': 'الاشتراكات النشطة',
        'dashboard.monthlyRevenue': 'الإيرادات الشهرية',
        'dashboard.unpaidCount': 'غير مدفوع',
        'dashboard.quickActions': 'إجراءات سريعة',
        'dashboard.addSubscriber': 'إضافة مشترك',
        'dashboard.newSubscription': 'اشتراك جديد',
        'dashboard.reviewUnpaid': 'مراجعة غير المدفوع',
        'dashboard.expiringSoon': 'تنتهي قريباً',
        'dashboard.recentActivity': 'النشاط الأخير',
        'dashboard.expiresIn': 'ينتهي خلال',
        'dashboard.days': 'أيام',
        'dashboard.noExpiring': 'لا توجد اشتراكات تنتهي قريباً',
        'dashboard.noActivity': 'لا يوجد نشاط حديث',

        // Common
        'common.search': 'بحث...',
        'common.notifications': 'الإشعارات',
        'common.profile': 'الملف الشخصي',
        'common.logout': 'تسجيل الخروج',
        'common.loading': 'جاري التحميل...',
        'common.error': 'حدث خطأ',
        'common.retry': 'إعادة المحاولة',
        'common.save': 'حفظ',
        'common.cancel': 'إلغاء',
        'common.delete': 'حذف',
        'common.edit': 'تعديل',
        'common.view': 'عرض',
        'common.active': 'نشط',
        'common.inactive': 'غير نشط',
        'common.paid': 'مدفوع',
        'common.unpaid': 'غير مدفوع',
        'common.pending': 'معلق',
        'common.expired': 'منتهي',
        'common.cancelled': 'ملغي',

        // Stats
        'stats.increase': 'زيادة',
        'stats.decrease': 'انخفاض',
        'stats.fromLastMonth': 'من الشهر الماضي',
    },
};

// Context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider
export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

    useEffect(() => {
        // Check saved preference
        const saved = localStorage.getItem('language') as Language;
        if (saved && (saved === 'en' || saved === 'ar')) {
            setLanguageState(saved);
        }
    }, []);

    useEffect(() => {
        // Update document direction
        document.documentElement.dir = direction;
        document.documentElement.lang = language;
        localStorage.setItem('language', language);
    }, [language, direction]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

// Hook
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Currency formatter for IQD
export function formatIQD(amount: number, language: Language = 'en'): string {
    if (language === 'ar') {
        return new Intl.NumberFormat('ar-IQ', {
            style: 'currency',
            currency: 'IQD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }
    return `${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)} IQD`;
}

// Date formatter
export function formatDate(date: string, language: Language = 'en'): string {
    const locale = language === 'ar' ? 'ar-IQ' : 'en-US';
    return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
