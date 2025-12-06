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

            // Auto-scale logic
            // This logic attempts to scale the UI to fit a "minimum comfortable width"
            // if the device is mobile but the content might be too wide.
            // However, for a responsive app, we usually just want to know the device type.

            // If we want to FORCE a scale (e.g. like a native app feel):
            const width = window.innerWidth;
            let newScale = 1;

            if (type === 'mobile') {
                // Example: If design assumes 375px base, but screen is 320px, scale down.
                // Or if we want to fit more content, we might scale down slightly.
                // For now, let's just set the device type class.
            }

            // Apply device type to body for CSS usage
            document.body.setAttribute('data-device', type);

            // Optional: Calculate a scale factor if needed for specific layouts
            // const designWidth = 1440;
            // if (width < designWidth && type === 'desktop') {
            //     newScale = width / designWidth;
            // }

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
                // transform: scale !== 1 ? `scale(${scale})` : 'none',
                // transformOrigin: 'top left',
                // width: scale !== 1 ? `${100 / scale}%` : '100%',
                minHeight: '100vh'
            }}
        >
            {children}
        </div>
    );
}
