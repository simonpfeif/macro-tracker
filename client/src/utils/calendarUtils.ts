export function generateCalendarDays(
  currentMonth: Date
): Array<{ date: string; day: number; isCurrentMonth: boolean }> {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

  // Add days from previous month to fill the first week
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({
      date: date.toISOString().split('T')[0],
      day: date.getDate(),
      isCurrentMonth: false,
    });
  }

  // Add days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    days.push({
      date: date.toISOString().split('T')[0],
      day,
      isCurrentMonth: true,
    });
  }

  // Add days from next month to complete the grid
  const endPadding = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= endPadding; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date: date.toISOString().split('T')[0],
      day: i,
      isCurrentMonth: false,
    });
  }

  return days;
}
