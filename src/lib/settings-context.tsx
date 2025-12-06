'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
    dateInputType: 'text' | 'date';
    setDateInputType: (type: 'text' | 'date') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [dateInputType, setDateInputTypeState] = useState<'text' | 'date'>('text');

    useEffect(() => {
        const savedType = localStorage.getItem('dateInputType') as 'text' | 'date';
        if (savedType) {
            setDateInputTypeState(savedType);
        }
    }, []);

    const setDateInputType = (type: 'text' | 'date') => {
        setDateInputTypeState(type);
        localStorage.setItem('dateInputType', type);
    };

    return (
        <SettingsContext.Provider value={{ dateInputType, setDateInputType }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
