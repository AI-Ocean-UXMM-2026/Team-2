/** Netlify may expose an internal request URL; URL is its trusted public site URL. */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;

  return [request.url, process.env["URL"]].some((target) => {
    if (!target) return false;
    try {
      const url = new URL(target);
      return (url.protocol === "https:" || url.protocol === "http:") && origin === url.origin;
    } catch {
      return false;
    }
  });
}
