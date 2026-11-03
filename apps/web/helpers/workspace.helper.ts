/**
 * Helper to get user-friendly display host for workspace URLs.
 * When running on local IPs (127.0.0.1, localhost), it shows the clean SaaS domain "app.plane.so"
 * so that the URL preview looks professional rather than an internal API/IP address.
 */
export const getWorkspaceDisplayHost = (): string => {
  if (typeof window === "undefined") return "app.plane.so";
  const host = window.location.host;
  if (
    !host ||
    host.includes("127.0.0.1") ||
    host.includes("localhost") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.startsWith("0.0.0.0")
  ) {
    return "app.plane.so";
  }
  return host;
};

