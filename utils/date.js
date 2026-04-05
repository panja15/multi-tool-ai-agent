function getCurrentIST() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);

  const map = {};
  parts.forEach(({ type, value }) => {
    map[type] = value;
  });

  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second} IST`;
}
