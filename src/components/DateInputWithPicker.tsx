'use client';

import React from 'react';

interface DateInputWithPickerProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    placeholder?: string;
    className?: string;
}

export default function DateInputWithPicker({
    value,
    onChange,
    required = false,
    placeholder = 'YYYY/MM/DD',
    className,
}: DateInputWithPickerProps) {
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {/* Visible Text Input (Display Only) */}
            <input
                type="text"
                value={value.replace(/-/g, '/')}
                readOnly
                className={className}
                placeholder={placeholder}
                required={required}
                style={{ paddingInlineEnd: '40px', cursor: 'pointer' }}
            />

            {/* Calendar Icon */}
            <div
                style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none', // Let clicks pass through to the date input
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-muted)',
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </div>

            {/* Invisible Date Input (Overlay) */}
            <input
                type="date"
                value={value.replace(/\//g, '-')}
                onChange={handleDateChange}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 10, // Ensure it's on top
                }}
                required={required}
            />
        </div>
    );
}
