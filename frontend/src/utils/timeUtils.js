/**
 * Formats a time string (HH:MM or HH:MM:SS) into 12-hour AM/PM format.
 * e.g. "13:30" → "1:30 PM"
 * e.g. "07:05:00" → "7:05 AM"
 */
export const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [hh, mm] = timeStr.split(':');
  let hours = parseInt(hh, 10);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${mm} ${suffix}`;
};

/**
 * Formats a JS Date object's current time into 12-hour AM/PM format.
 * e.g. new Date() at 14:05 → "2:05 PM"
 */
export const formatDateTo12h = (dateObj) => {
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${suffix}`;
};
