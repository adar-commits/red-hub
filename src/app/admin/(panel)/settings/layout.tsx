import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { isAdminSettingsUser } from "@/lib/admin-settings-access";

export default async function AdminSettingsSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminSettingsUser(session.user.email)) {
    redirect("/admin/announcements");
  }
  return <>{children}</>;
}
