export function auth(handler) {
  return (req) => handler(req, {});
}
