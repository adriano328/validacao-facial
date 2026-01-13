/// formata data 26/04/1995 para 1995-04-26
export function brDateToISO(date: string) {
  if (!date) return null;
  const [day, month, year] = date.split("/");
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}