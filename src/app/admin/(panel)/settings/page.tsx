import Link from "next/link";

const activityLogSubtitle =
  "התחברות, העלאת חשבונית, עדכון פרטי עסק, הוספת עסקה חדשה";

const announcementsCard = {
  href: "/admin/settings/announcements",
  title: "ניהול עדכונים",
  subtitle: "ניהול עדכונים המוצגים במסך הבית של המעצבים",
  icon: "\uD83D\uDCE2",
  iconBg: "bg-amber-500/20",
};

const generalCard = {
  href: "/admin/settings/general",
  title: "הגדרות כלליות",
  subtitle: "הגדרות מערכת כלליות",
  icon: "\u2600\uFE0F",
  iconBg: "bg-purple-500/20",
};

const activityCard = {
  href: "/admin/settings/activity",
  title: "מעקב פעילות",
  subtitle: activityLogSubtitle,
  icon: "\uD83D\uDCCA",
  iconBg: "bg-teal-500/20",
};

const cards = [activityCard, announcementsCard, generalCard];

export default function AdminSettingsLobbyPage() {
  return (
    <div className="min-h-[60vh] rounded-2xl bg-[#1a1a1a] text-white p-6 md:p-8">
      <h1 className="text-2xl font-bold mb-1">הגדרות</h1>
      <p className="text-white/70 text-sm mb-8">בחר אזור להגדרה</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex items-center gap-4 p-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
          >
            <span className="text-2xl">←</span>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-white group-hover:text-white">{c.title}</h2>
              <p className="text-sm text-white/60 line-clamp-2">{c.subtitle}</p>
            </div>
            <span
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${c.iconBg}`}
              aria-hidden
            >
              {c.icon}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
