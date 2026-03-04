"use client";

import { useEffect, useState } from "react";

function getTimeGreeting(): { text: string; icon: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "בוקר טוב", icon: "🌅" };
  if (hour >= 12 && hour < 17) return { text: "צהריים טובים", icon: "☀️" };
  if (hour >= 17 && hour < 21) return { text: "אחר צהריים טובים", icon: "🌤️" };
  return { text: "ערב טוב", icon: "🌙" };
}

function getFirstName(fullName: string | null): string {
  if (!fullName?.trim()) return "מעצב/ת";
  return fullName.trim().split(/\s+/)[0] || fullName;
}

/** Default Tel Aviv for weather when geolocation not used */
const DEFAULT_LAT = 32.0853;
const DEFAULT_LON = 34.7818;

export function SidebarGreeting({ fullName }: { fullName: string | null }) {
  const [temp, setTemp] = useState<number | null>(null);
  const { text, icon } = getTimeGreeting();
  const firstName = getFirstName(fullName);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lat = DEFAULT_LAT;
        const lon = DEFAULT_LON;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`;
        const res = await fetch(url);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { current?: { temperature_2m?: number } };
        const t = data?.current?.temperature_2m;
        if (typeof t === "number" && !cancelled) setTemp(Math.round(t));
      } catch {
        if (!cancelled) setTemp(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-white/90 flex-wrap">
      <span aria-hidden>{icon}</span>
      <span>
        {text}, {firstName}
      </span>
      {temp !== null && (
        <span className="text-white/80" aria-label={`טמפרטורה ${temp} מעלות`}>
          {temp}°C
        </span>
      )}
    </div>
  );
}
