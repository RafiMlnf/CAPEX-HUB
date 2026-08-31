const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr || dateStr === "-" || dateStr.trim() === "") return "-";

  // Pure date only (YYYY-MM-DD without time part) -> format directly without timezone shifts
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    const [year, month, day] = dateStr.trim().split("-");
    const monthIdx = parseInt(month, 10) - 1;
    const monthName = INDONESIAN_MONTHS[monthIdx] || month;
    return `${parseInt(day, 10)} ${monthName} ${year}`;
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    try {
      const parts = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(d);

      const day = parts.find((p) => p.type === "day")?.value || String(d.getDate());
      const month = parts.find((p) => p.type === "month")?.value || (INDONESIAN_MONTHS[d.getMonth()] || "");
      const year = parts.find((p) => p.type === "year")?.value || String(d.getFullYear());
      const hour = parts.find((p) => p.type === "hour")?.value?.padStart(2, "0") || "00";
      const minute = parts.find((p) => p.type === "minute")?.value?.padStart(2, "0") || "00";

      const hasTime = dateStr.includes("T") || dateStr.includes(":") || (d.getHours() !== 0 || d.getMinutes() !== 0);
      if (hasTime) {
        return `${parseInt(day, 10)} ${month} ${year} pukul ${hour}:${minute} WIB`;
      }
      return `${parseInt(day, 10)} ${month} ${year}`;
    } catch {
      const day = d.getDate();
      const monthName = INDONESIAN_MONTHS[d.getMonth()] || String(d.getMonth() + 1);
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      if (dateStr.includes("T") || dateStr.includes(" ") || (d.getHours() !== 0 || d.getMinutes() !== 0)) {
        return `${day} ${monthName} ${year} pukul ${hours}:${minutes} WIB`;
      }
      return `${day} ${monthName} ${year}`;
    }
  }

  return dateStr;
}

export function formatDateWIB(dateStr?: string): string {
  return formatDateDisplay(dateStr);
}
