"use client";

import { useEffect, useState } from "react";

/**
 * Daily check-in reminder using the browser Notification API.
 *
 * Deliberately local-only: the reminder time is stored in localStorage and
 * fired by the page, so HerBeat never needs a push service holding a
 * device token tied to a health account. When the wearable ships, swap this
 * for real Web Push with VAPID keys - noted in the README.
 */
export function NotificationOptIn() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [time, setTime] = useState("20:00");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    const saved = localStorage.getItem("herbeat:reminderTime");
    if (saved) setTime(saved);
  }, []);

  useEffect(() => {
    if (permission !== "granted") return;
    localStorage.setItem("herbeat:reminderTime", time);

    const check = setInterval(() => {
      const now = new Date();
      const [h, m] = time.split(":").map(Number);
      const stamp = `${now.toDateString()}-${time}`;
      if (
        now.getHours() === h &&
        now.getMinutes() === m &&
        localStorage.getItem("herbeat:lastNotified") !== stamp
      ) {
        new Notification("HerBeat", { body: "Quick check-in? Takes fifteen seconds." });
        localStorage.setItem("herbeat:lastNotified", stamp);
      }
    }, 30000);

    return () => clearInterval(check);
  }, [permission, time]);

  async function enable() {
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  if (permission === "unsupported") return null;

  return (
    <div className="rounded-md border border-line bg-surface p-5">
      <p className="text-[0.95rem] font-medium text-ink">Daily reminder</p>
      {permission === "granted" ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label htmlFor="rtime" className="text-sm text-inkSoft">Remind me at</label>
          <input
            id="rtime" type="time" value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-[var(--violet)]"
          />
          <span className="text-xs text-inkFaint">Works while HerBeat is open in a tab.</span>
        </div>
      ) : permission === "denied" ? (
        <p className="mt-2 text-sm text-inkSoft">
          Notifications are blocked for this site. Re-enable them in your browser settings to
          get reminders.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-inkSoft">
            A nudge once a day is the difference between a month of data and three scattered
            entries.
          </p>
          <button
            onClick={enable}
            className="mt-3 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-[var(--violet-mist)]"
          >
            Turn on reminders
          </button>
        </>
      )}
    </div>
  );
}
