function getNext8WeekCodes() {
  const weeks = [];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const targetDate = new Date(now.getTime() + (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const targetThursday = new Date(targetDate.getTime());
    targetThursday.setDate(targetDate.getDate() - (targetDate.getDay() || 7) + 4);
    const year = targetThursday.getFullYear();
    const jan4 = new Date(year, 0, 4);
    const jan4Thursday = new Date(jan4.getTime());
    jan4Thursday.setDate(jan4.getDate() - (jan4.getDay() || 7) + 4);
    const weekNum = Math.round(((targetThursday.getTime() - jan4Thursday.getTime()) / 86400000) / 7) + 1;
    weeks.push(`${year}-W${weekNum.toString().padStart(2, '0')}`);
  }
  return weeks;
}
console.log(getNext8WeekCodes());
