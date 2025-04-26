/**
 * URL utilities for generating consistent URLs across development and production
 */

/**
 * Get the base URL for the application
 * Uses VITE_BASE_URL in production, or falls back to window.location.origin
 */
export const getBaseUrl = (): string => {
  // In production, use the configured domain
  if (import.meta.env.PROD && import.meta.env.VITE_BASE_URL) {
    return import.meta.env.VITE_BASE_URL as string;
  }
  
  // In development or if production URL is not configured, use current origin
  return window.location.origin;
};

/**
 * Generate a full URL with the configured base URL
 * @param path The path to append to the base URL
 * @param params Optional query parameters object
 */
export const generateUrl = (path: string, params?: Record<string, string>): string => {
  const baseUrl = getBaseUrl();
  const url = new URL(path, baseUrl);
  
  // Add any query parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  return url.toString();
};

/**
 * Generate a confirmation URL
 * @param orderId The order ID for confirmation
 */
export const generateConfirmationUrl = (orderId: string): string => {
  return generateUrl('/confirmation', { orderId });
}; 