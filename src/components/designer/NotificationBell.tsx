"use client";

import { useEffect, useState } from "react";

export function NotificationBell({ designerCode }: { designerCode: string }) {
  const [list, setList] = useState<{ id: string; message: string; read: boolean; created_at: string }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]));
  }, []);

  const unread = list.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-full hover:bg-gray-100"
        aria-label="התראות"
      >
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute top-0 left-0 min-w-[18px] h-[18px] rounded-full bg-[var(--brand-red)] text-white text-xs flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-72 max-h-64 overflow-auto bg-white border rounded-lg shadow-lg z-50 p-2">
            {list.length === 0 ? (
              <p className="text-sm text-gray-500 p-2">אין התראות</p>
            ) : (
              list.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`p-2 text-sm border-b last:border-0 ${n.read ? "text-gray-500" : "font-medium"}`}
                >
                  {n.message}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
