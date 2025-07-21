/**
 * CSRF Token utility functions
 * These functions help protect against Cross-Site Request Forgery attacks
 */

/**
 * Generate a cryptographically secure random token
 * @returns A random hex string to use as a CSRF token
 */
export function generateCSRFToken(): string {
  // Use crypto API to generate a secure random token
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get the current CSRF token or create a new one if none exists
 * @returns The current CSRF token
 */
export function getCSRFToken(): string {
  let token = sessionStorage.getItem('csrf_token');

  // If no token exists, generate a new one
  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem('csrf_token', token);

    // Also store in localStorage for development purposes
    // This helps with token persistence across page reloads
    localStorage.setItem('csrf_token_backup', token);
  }

  return token;
}

/**
 * Get a valid CSRF token, with fallback mechanisms for development
 * @returns A valid CSRF token
 */
export function getValidCSRFToken(): string {
  // Try to get from session storage first
  let token = sessionStorage.getItem('csrf_token');

  // If not in session storage, try localStorage backup
  if (!token) {
    token = localStorage.getItem('csrf_token_backup');

    // If found in localStorage, restore to sessionStorage
    if (token) {
      sessionStorage.setItem('csrf_token', token);
    } else {
      // Generate new token if not found anywhere
      token = generateCSRFToken();
      sessionStorage.setItem('csrf_token', token);
      localStorage.setItem('csrf_token_backup', token);
    }
  }

  return token;
}

/**
 * Refresh the CSRF token (useful after login/logout)
 * @returns The new CSRF token
 */
export function refreshCSRFToken(): string {
  const token = generateCSRFToken();
  sessionStorage.setItem('csrf_token', token);
  return token;
}

/**
 * Add a CSRF token to a form element
 * @param form The form element to add the token to
 */
export function addCSRFTokenToForm(form: HTMLFormElement): void {
  // Remove any existing CSRF token input
  const existingToken = form.querySelector('input[name="csrf_token"]');
  if (existingToken) {
    existingToken.remove();
  }

  // Create a new hidden input with the current token
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'csrf_token';
  input.value = getCSRFToken();

  // Add the input to the form
  form.appendChild(input);
}

/**
 * Initialize CSRF protection for the application
 * Call this once at application startup
 */
export function initCSRFProtection(): void {
  // Ensure we have a CSRF token
  getCSRFToken();

  // Add CSRF token to all fetch/XHR requests
  const originalFetch = window.fetch;
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    // Clone the init object to avoid modifying the original
    const modifiedInit = init ? { ...init } : {};

    // Add CSRF token to headers if this is a mutation (non-GET) request
    if (modifiedInit.method && modifiedInit.method !== 'GET') {
      modifiedInit.headers = {
        ...modifiedInit.headers,
        'X-CSRF-Token': getCSRFToken()
      };
    }

    // Call the original fetch with our modified init
    return originalFetch.call(this, input, modifiedInit);
  };
}
