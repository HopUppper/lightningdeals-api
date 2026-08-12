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

export async function adminFetch(url: string, options: RequestInit = {}, timeoutMs: number = 15000): Promise<Response> {
  const defaultHeaders = getAuthHeaders();
  const requestId = `req_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const mergedOptions: RequestInit = {
    credentials: 'include',
    signal: controller.signal,
    ...options,
    headers: {
      'X-Request-ID': requestId,
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    clearTimeout(timer);
    return response;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000} seconds. Please try again.`);
    }
    throw new Error(err.message || 'Network error connecting to LightningDeals server.');
  }
}

export async function parseApiResponse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  let data: any = {};

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }
  }

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || data?.error || `Request failed with HTTP status ${response.status}`;
    const errObj = new Error(errorMsg) as any;
    errObj.status = response.status;
    errObj.type = data?.error?.type || 'api_error';
    errObj.code = data?.error?.code || `HTTP_${response.status}`;
    errObj.requestId = data?.error?.requestId || response.headers.get('x-request-id') || null;
    throw errObj;
  }

  return data as T;
}
