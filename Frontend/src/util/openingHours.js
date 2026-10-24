import { WEEKDAYS } from "./settings";

// Wochentag und Uhrzeit (Minuten seit Mitternacht) in der Zeitzone des Restaurants
const localTime = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return {
    dayIndex: WEEKDAYS.indexOf(get("weekday").toUpperCase()),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
};

const toMinutes = (time) => {
  const [h, m] = String(time || "").split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

const slotsOf = (hours, dayIndex) => (hours?.days?.[WEEKDAYS[(dayIndex + 7) % 7]] || [])
  .map((slot) => ({ open: toMinutes(slot.open), close: toMinutes(slot.close) }))
  .filter((slot) => slot.open !== null && slot.close !== null && slot.open !== slot.close);

// Gleiche Regeln wie im Backend: Endet ein Zeitfenster vor dem Beginn, geht es über Mitternacht
export const isOpenAt = (hours, date = new Date()) => {
  try {
    const { dayIndex, minutes } = localTime(date, hours.timeZone);
    const today = slotsOf(hours, dayIndex).some((s) => minutes >= s.open && (s.close < s.open || minutes < s.close));
    const fromYesterday = slotsOf(hours, dayIndex - 1).some((s) => s.close < s.open && minutes < s.close);
    return today || fromYesterday;
  } catch {
    // Ungültige Zeitzone: Bestellungen nicht blockieren, das Backend prüft selbst
    return true;
  }
};

// Nächste Öffnung: { daysAhead: 0 = heute, 1 = morgen, ..., weekday: "MONDAY", time: "11:00" } oder null
export const nextOpening = (hours, date = new Date()) => {
  try {
    const { dayIndex, minutes } = localTime(date, hours.timeZone);
    for (let daysAhead = 0; daysAhead <= 7; daysAhead += 1) {
      const slots = slotsOf(hours, dayIndex + daysAhead)
        .filter((s) => daysAhead > 0 || s.open > minutes)
        .sort((a, b) => a.open - b.open);
      if (slots.length) {
        const open = slots[0].open;
        const time = `${String(Math.floor(open / 60)).padStart(2, "0")}:${String(open % 60).padStart(2, "0")}`;
        return { daysAhead, weekday: WEEKDAYS[(dayIndex + daysAhead) % 7], time };
      }
    }
  } catch {
    // keine Angabe möglich
  }
  return null;
};
