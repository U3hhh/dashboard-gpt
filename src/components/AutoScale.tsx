'use client';

import { useEffect, useState } from 'react';
import { getDeviceType, DeviceType } from '@/lib/device-detection';

export default function AutoScale({ children }: { children: React.ReactNode }) {
    const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            const type = getDeviceType();
            setDeviceType(type);

            const width = window.innerWidth;
            let newScale = 1;

            if (type === 'mobile') {
                // Mobile scaling: base design width 375px
                const mobileBaseWidth = 375;
                newScale = width / mobileBaseWidth;
            } else if (type === 'tablet') {
                // Tablet scaling: base design width 768px
                const tabletBaseWidth = 768;
                newScale = width / tabletBaseWidth;
            } else if (type === 'desktop') {
                // Desktop scaling: base design width 1440px
                const desktopBaseWidth = 1440;
                newScale = width / desktopBaseWidth;
            }

            // Apply device type to body for CSS usage
            document.body.setAttribute('data-device', type);

            setScale(newScale);
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div
            className={`device-${deviceType}`}
            style={{
                transform: scale !== 1 ? `scale(${scale})` : 'none',
                transformOrigin: 'top left',
                width: scale !== 1 ? `${100 / scale}%` : '100%',
                minHeight: scale !== 1 ? `${100 / scale}vh` : '100vh'
            }}
        >
            {children}
        </div>
    );
}
