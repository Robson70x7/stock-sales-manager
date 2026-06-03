export function sanitizeParams(params: any[]): any[] {
  return params.map(p => p === undefined ? null : p);
}
