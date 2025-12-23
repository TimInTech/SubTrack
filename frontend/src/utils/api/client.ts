/**
 * HTTP client utilities with error handling and validation
 */

import { parseApiError, validateApiResponse, ApiResponse, SubTrackApiError } from './errors';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const DEFAULT_TIMEOUT = 30000; // 30 seconds

export interface RequestOptions extends RequestInit {
  timeout?: number;
  validateResponse?: boolean;
}

/**
 * Create fetch request with timeout
 */
function fetchWithTimeout(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  return Promise.race([
    fetch(url, fetchOptions),
    new Promise<Response>((_, reject) =>
      setTimeout(
        () => reject(new Error('Request timeout')),
        timeout
      )
    ),
  ]);
}

/**
 * Make an API request with error handling
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeout,
    validateResponse: shouldValidate = false,
    headers = {},
    ...fetchOptions
  } = options;

  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetchWithTimeout(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout,
    });

    // Parse JSON response
    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle non-2xx responses
    if (!response.ok) {
      throw parseApiError({
        response: {
          status: response.status,
          data,
        },
      });
    }

    // Validate response structure if requested
    if (shouldValidate) {
      const validatedResponse = validateApiResponse<T>(data);
      return validatedResponse.data as T;
    }

    return data as T;
  } catch (error: any) {
    // If already a SubTrackApiError, re-throw
    if (error instanceof SubTrackApiError) {
      throw error;
    }

    // Check for timeout
    if (error.message === 'Request timeout') {
      throw new SubTrackApiError(
        'Die Anfrage hat zu lange gedauert',
        'TIMEOUT_ERROR'
      );
    }

    // Parse other errors
    throw parseApiError(error);
  }
}

/**
 * GET request
 */
export async function apiGet<T = any>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'GET',
  });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T = any>(
  endpoint: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}
