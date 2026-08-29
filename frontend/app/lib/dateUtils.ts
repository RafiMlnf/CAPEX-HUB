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

  // Match ISO YYYY-MM-DD or YYYY-MM-DDTHH:mm
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (match) {
    const [, year, month, day, hours, minutes] = match;
    const monthIdx = parseInt(month, 10) - 1;
    const monthName = INDONESIAN_MONTHS[monthIdx] || month;
    if (hours && minutes) {
      return `${parseInt(day, 10)} ${monthName} ${year} pukul ${hours}:${minutes} WIB`;
    }
    return `${parseInt(day, 10)} ${monthName} ${year}`;
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
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

  return dateStr;
}

export function formatDateWIB(dateStr?: string): string {
  return formatDateDisplay(dateStr);
}
