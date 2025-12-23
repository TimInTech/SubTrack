/**
 * API error handling utilities for SubTrack frontend
 */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export class SubTrackApiError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;
  public readonly statusCode?: number;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode?: number,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'SubTrackApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  /**
   * Get a user-friendly error message in German
   */
  public getUserMessage(): string {
    switch (this.code) {
      case 'VALIDATION_ERROR':
        return this.message || 'Ungültige Eingabe. Bitte überprüfen Sie Ihre Daten.';
      case 'NOT_FOUND':
        return this.message || 'Der gesuchte Eintrag wurde nicht gefunden.';
      case 'DATABASE_ERROR':
        return 'Ein Fehler ist beim Speichern aufgetreten. Bitte versuchen Sie es erneut.';
      case 'HTTP_ERROR':
        return this.message || 'Ein Netzwerkfehler ist aufgetreten.';
      case 'NETWORK_ERROR':
        return 'Keine Verbindung zum Server. Bitte überprüfen Sie Ihre Internetverbindung.';
      case 'TIMEOUT_ERROR':
        return 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.';
      default:
        return this.message || 'Ein unerwarteter Fehler ist aufgetreten.';
    }
  }
}

/**
 * Parse error from API response
 */
export function parseApiError(error: any): SubTrackApiError {
  // Network error (no response)
  if (!error.response && error.message) {
    return new SubTrackApiError(
      error.message,
      'NETWORK_ERROR',
      undefined,
      { originalError: error.message }
    );
  }

  // HTTP error with response
  if (error.response) {
    const statusCode = error.response.status;
    const data = error.response.data;

    // Standardized API error response
    if (data?.error) {
      return new SubTrackApiError(
        data.error.message || 'Ein Fehler ist aufgetreten',
        data.error.code || 'HTTP_ERROR',
        statusCode,
        data.error.details
      );
    }

    // FastAPI validation error
    if (data?.detail) {
      if (Array.isArray(data.detail)) {
        const messages = data.detail.map((d: any) => d.msg).join(', ');
        return new SubTrackApiError(
          messages,
          'VALIDATION_ERROR',
          statusCode,
          { validationErrors: data.detail }
        );
      }
      return new SubTrackApiError(
        data.detail,
        'HTTP_ERROR',
        statusCode
      );
    }

    // Generic HTTP error
    return new SubTrackApiError(
      `HTTP ${statusCode} Fehler`,
      'HTTP_ERROR',
      statusCode
    );
  }

  // Unknown error
  return new SubTrackApiError(
    error.message || 'Ein unbekannter Fehler ist aufgetreten',
    'UNKNOWN_ERROR'
  );
}

/**
 * Validate API response structure
 */
export function validateApiResponse<T>(response: any): ApiResponse<T> {
  if (typeof response !== 'object' || response === null) {
    throw new SubTrackApiError(
      'Ungültige API-Antwort',
      'INVALID_RESPONSE'
    );
  }

  // Check for standardized error response
  if (response.success === false && response.error) {
    throw new SubTrackApiError(
      response.error.message,
      response.error.code || 'API_ERROR',
      undefined,
      response.error.details
    );
  }

  return response as ApiResponse<T>;
}

/**
 * Log error for debugging (can be extended to send to monitoring service)
 */
export function logError(error: SubTrackApiError, context?: string): void {
  if (__DEV__) {
    console.error(`[SubTrack Error${context ? ` - ${context}` : ''}]:`, {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
    });
  }
  
  // TODO: In production, send to error monitoring service
  // Example: Sentry.captureException(error);
}
