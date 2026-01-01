import type { PaginatedResponse } from '../types/database';

export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Extract pagination parameters from URL search params
 * @param searchParams - URL search params object
 * @returns Pagination parameters with page, limit, and offset
 */
export function getPaginationParams(
    searchParams: URLSearchParams | { page?: string; limit?: string }
): PaginationParams {
    let pageStr: string | null = null;
    let limitStr: string | null = null;

    if (searchParams instanceof URLSearchParams) {
        pageStr = searchParams.get('page');
        limitStr = searchParams.get('limit');
    } else {
        pageStr = searchParams.page || null;
        limitStr = searchParams.limit || null;
    }

    const page = Math.max(1, parseInt(pageStr || String(DEFAULT_PAGE), 10) || DEFAULT_PAGE);
    const limit = Math.min(
        MAX_LIMIT,
        Math.max(1, parseInt(limitStr || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}

/**
 * Create a paginated response object
 * @param data - Array of items for current page
 * @param total - Total count of all items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Paginated response object
 */
export function createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResponse<T> {
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Calculate range for Supabase query
 * @param params - Pagination parameters
 * @returns Object with from and to values for Supabase range
 */
export function getSupabaseRange(params: PaginationParams): { from: number; to: number } {
    return {
        from: params.offset,
        to: params.offset + params.limit - 1,
    };
}
