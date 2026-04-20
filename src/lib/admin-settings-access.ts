/**
 * Accounts that may open general settings and privileged admin APIs (e.g. designers import).
 * Activity log is available to any admin portal user in `admin_portal_users`.
 */
const ADMIN_SETTINGS_EMAILS = new Set([
  "test@carpetshop.co.il",
  "noa@carpetshop.co.il",
  "designers@carpetshop.co.il",
]);

export function isAdminSettingsUser(email: string | null | undefined): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  return normalized.length > 0 && ADMIN_SETTINGS_EMAILS.has(normalized);
}
