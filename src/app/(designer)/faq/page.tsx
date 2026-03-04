import { redirect } from "next/navigation";
import { getDesignerSession } from "@/lib/session";

export default async function FAQPage() {
  const session = await getDesignerSession();
  if (!session?.designerCode) redirect("/");

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--brand-red)]">הדרכה + שאלות ותשובות</h1>
      <section className="prose prose-sm">
        <h2 className="text-lg font-semibold">איך משתמשים בפורטל?</h2>
        <p>במסך הבית תוכלו לראות סיכום עמלות, עדכונים ועסקאות אחרונות. בעסקאות שלי — רשימת כל העסקאות המשויכות אליכם. בתעודות עמלה — העלאת חשבונית וצפייה בסטטוס תשלום.</p>
        <h2 className="text-lg font-semibold mt-4">איך מוסיפים הפניה?</h2>
        <p>בעסקאות שלי לחצו על &quot;הוספת עסקה חדשה&quot; והזינו טלפון הלקוח/ה ופרט נוסף (שם מלא לקוח, סניף, איש מכירות וכו׳).</p>
        <h2 className="text-lg font-semibold mt-4">צריכים עזרה?</h2>
        <p>בדף &quot;כתבו לנו&quot; ניתן לשלוח הודעה ונחזור בהקדם.</p>
      </section>
    </div>
  );
}
