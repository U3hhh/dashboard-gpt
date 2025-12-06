'use client';

import { SettingsProvider } from '@/lib/settings-context';
import AutoScale from '@/components/AutoScale';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SettingsProvider>
            <AutoScale>
                {children}
            </AutoScale>
        </SettingsProvider>
    );
}
