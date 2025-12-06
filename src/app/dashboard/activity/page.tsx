'use client';

import PlaceholderPage from '@/components/PlaceholderPage';

export default function ActivityPage() {
    return (
        <PlaceholderPage
            titleKey="nav.activity"
            icon={
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            }
        />
    );
}
