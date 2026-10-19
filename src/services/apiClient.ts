/**
 * Titan Auto API Client Wrapper
 * Prepared for NestJS API endpoints integration.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:4001/api/v1';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const token = localStorage.getItem('titan_auth_token');

  // Debug logging without printing sensitive token contents
  // console.log(`Access token present: ${!!token}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Active role and branch/franchise scope headers for authoritative server-side filtering
  const activeRole = localStorage.getItem('titan_active_role');
  if (activeRole && !headers['x-active-role']) {
    headers['x-active-role'] = activeRole;
  }

  const activeBranchId = localStorage.getItem('titan_active_branch_id');
  if (activeBranchId && activeBranchId !== 'ALL' && !headers['x-active-branch-id']) {
    headers['x-active-branch-id'] = activeBranchId;
  }

  const activeFranchiseId = localStorage.getItem('titan_active_franchise_id');
  if (activeFranchiseId && activeFranchiseId !== 'ALL' && !headers['x-active-franchise-id']) {
    headers['x-active-franchise-id'] = activeFranchiseId;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle token expiration & automatic refresh
    if (
      response.status === 401 &&
      !isRetry &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/refresh')
    ) {
      const refreshToken = localStorage.getItem('titan_refresh_token');
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const newAccessToken = refreshData?.data?.accessToken || refreshData?.accessToken;
            const newRefreshToken = refreshData?.data?.refreshToken || refreshData?.refreshToken;

            if (newAccessToken) {
              localStorage.setItem('titan_auth_token', newAccessToken);
              if (newRefreshToken) {
                localStorage.setItem('titan_refresh_token', newRefreshToken);
              }
              // Retry original request ONCE with new access token
              return apiFetch<T>(endpoint, options, true);
            }
          }
        } catch {
          // Token refresh failed silently
        }
      }

      // If refresh failed or missing, clear auth state
      localStorage.removeItem('titan_auth_token');
      localStorage.removeItem('titan_refresh_token');
      localStorage.removeItem('titan_is_authenticated');
      localStorage.removeItem('titan_user_profile');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      const validationDetails = Array.isArray(errorData.errors) && errorData.errors.length > 0
        ? errorData.errors.join('; ')
        : null;
      const message = validationDetails
        ? `${errorData.message || 'Validation failed'}: ${validationDetails}`
        : errorData.message || 'An API error occurred';

      throw new ApiError(
        response.status,
        message,
        errorData.errors
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(503, 'Backend service unreachable. Showing empty state.');
  }
}

export function unwrapData<T>(res: any): T {
  if (res && typeof res === 'object' && 'data' in res && res.data !== undefined) {
    return res.data as T;
  }
  return res as T;
}


