/** Only this account may open general settings and privileged admin APIs (e.g. designers import). Activity log is available to any admin portal user. */
export const ADMIN_SETTINGS_EMAIL = "test@carpetshop.co.il";

export function isAdminSettingsUser(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === ADMIN_SETTINGS_EMAIL;
}
