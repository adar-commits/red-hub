/** Only this account may open activity log, general settings, and related APIs. */
export const ADMIN_SETTINGS_EMAIL = "test@carpetshop.co.il";

export function isAdminSettingsUser(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === ADMIN_SETTINGS_EMAIL;
}
