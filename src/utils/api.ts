export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('apexscale_token') || localStorage.getItem('ld_admin_token') || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const defaultHeaders = getAuthHeaders();
  const mergedOptions: RequestInit = {
    credentials: 'include',
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };
  return fetch(url, mergedOptions);
}
