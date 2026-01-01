/**
 * Format a date string for display
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export function formatDate(
    date: string | Date,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format a date as ISO date string (YYYY-MM-DD)
 * @param date - Date string or Date object
 * @returns ISO date string
 */
export function toISODate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
}

/**
 * Get a date N days from now
 * @param days - Number of days from today
 * @returns Date object
 */
export function daysFromNow(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

/**
 * Get the start of today
 * @returns Date object representing start of today
 */
export function startOfToday(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
}

/**
 * Get the end of today
 * @returns Date object representing end of today
 */
export function endOfToday(): Date {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
}

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns True if date is in the past
 */
export function isPast(date: string | Date): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj < new Date();
}

/**
 * Check if a date is expiring within N days
 * @param date - Date to check
 * @param days - Number of days threshold
 * @returns True if date is within the threshold
 */
export function isExpiringWithin(date: string | Date, days: number): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const threshold = daysFromNow(days);
    return dateObj >= now && dateObj <= threshold;
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 * @param date - Date to compare
 * @returns Relative time string
 */
export function getRelativeTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (Math.abs(diffDays) >= 1) {
        return diffDays > 0 ? `in ${diffDays} day${diffDays > 1 ? 's' : ''}` : `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`;
    } else if (Math.abs(diffHours) >= 1) {
        return diffHours > 0 ? `in ${diffHours} hour${diffHours > 1 ? 's' : ''}` : `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ago`;
    } else {
        return diffMinutes > 0 ? `in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}` : `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) > 1 ? 's' : ''} ago`;
    }
}

/**
 * Get first day of current month
 * @returns Date object
 */
export function startOfMonth(): Date {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
}

/**
 * Get last day of current month
 * @returns Date object
 */
export function endOfMonth(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    date.setHours(23, 59, 59, 999);
    return date;
}
