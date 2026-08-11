/**
 * HTML Entity Sanitization Utility to protect against Stored & Reflected XSS
 */
export function sanitizeText(input: any): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitizeText(obj) as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as any;
  }
  if (typeof obj === 'object' && obj !== null) {
    const res: any = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = sanitizeObject(v);
    }
    return res;
  }
  return obj;
}
