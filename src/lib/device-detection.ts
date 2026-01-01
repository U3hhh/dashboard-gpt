export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function getDeviceType(): DeviceType {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;
    const userAgent = navigator.userAgent.toLowerCase();

    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

    if (width < 768 || (isMobileUA && width < 768)) {
        return 'mobile';
    } else if (width >= 768 && width < 1024) {
        return 'tablet';
    } else {
        return 'desktop';
    }
}
