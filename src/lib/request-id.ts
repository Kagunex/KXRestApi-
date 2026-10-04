export function generateRequestId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `kx_${ts}_${rand}`;
}

export function resolveRequestId(request: Request): string {
  const incoming = request.headers.get("x-request-id");
  if (incoming && /^[a-zA-Z0-9_-]{8,64}$/.test(incoming)) {
    return incoming;
  }
  return generateRequestId();
}
