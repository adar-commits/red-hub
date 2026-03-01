import { redirect } from "next/navigation";
import { getDesignerSession, isSessionExpired } from "@/lib/session";
import { DesignerShell } from "@/components/designer/DesignerShell";

export default async function DesignerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDesignerSession();
  if (!session?.designerCode || isSessionExpired(session)) {
    redirect("/");
  }

  return (
    <DesignerShell
      designerCode={session.designerCode}
      fullName={session.fullName}
    >
      {children}
    </DesignerShell>
  );
}
