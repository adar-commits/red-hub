import { redirect } from "next/navigation";
import { getDesignerSession } from "@/lib/session";
import { ContactForm } from "@/components/designer/ContactForm";

export default async function ContactPage() {
  const session = await getDesignerSession();
  if (!session?.designerCode) redirect("/");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--brand-red)]">כתבו לנו</h1>
      <ContactForm designerCode={session.designerCode} />
    </div>
  );
}
