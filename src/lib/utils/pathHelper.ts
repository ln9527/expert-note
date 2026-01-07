/**
 * Path helper utilities for handling BASE_PATH in production
 *
 * In production, the app is served at /annote/ so all paths need to be prefixed
 * In development, BASE_PATH is empty so paths work as normal
 */

// Use NEXT_PUBLIC_BASE_PATH for client-side access (set via next.config.js env)
// Falls back to BASE_PATH for server-side code
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || '';

/**
 * Build a path with the BASE_PATH prefix
 * @param path - The path to prefix (should start with /)
 * @returns The full path with BASE_PATH prefix
 */
export function buildPath(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Remove trailing slash from BASE_PATH and leading slash from path to avoid double slashes
  if (BASE_PATH) {
    const cleanBasePath = BASE_PATH.endsWith('/') ? BASE_PATH.slice(0, -1) : BASE_PATH;
    return `${cleanBasePath}${normalizedPath}`;
  }

  return normalizedPath;
}

/**
 * Build an API path with the BASE_PATH prefix
 * @param endpoint - The API endpoint (without /api/ prefix)
 * @returns The full API path
 */
export function buildApiPath(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return buildPath(`/api/${cleanEndpoint}`);
}

/**
 * Get the BASE_PATH value
 * @returns The BASE_PATH environment variable value
 */
export function getBasePath(): string {
  return BASE_PATH;
}
