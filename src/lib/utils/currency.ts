/**
 * Format a number as Iraqi Dinar (IQD)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatIQD(amount: number): string {
    return new Intl.NumberFormat('ar-IQ', {
        style: 'currency',
        currency: 'IQD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format a number as IQD with English number format
 * @param amount - The amount to format
 * @returns Formatted currency string with English numbers
 */
export function formatIQDEnglish(amount: number): string {
    return `${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)} IQD`;
}

/**
 * Parse a currency string back to number
 * @param value - The currency string to parse
 * @returns The numeric value
 */
export function parseCurrency(value: string): number {
    // Remove all non-numeric characters except decimal point and minus
    const cleaned = value.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
}
