'use client';

import PlaceholderPage from '@/components/PlaceholderPage';

export default function PlansPage() {
    return (
        <PlaceholderPage
            titleKey="nav.plans"
            icon={
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
            }
        />
    );
}
