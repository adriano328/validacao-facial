/// formata data 26/04/1995 para 1995-04-26
export function brDateToISO(date: string) {
  if (!date) return null;
  const [day, month, year] = date.split("/");
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/// formata data 1995-04-26 para 26-04-1995 
export function formatarDataToBr(data: string): string {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
    return data;
  }

  const [datePart] = data.split("T");
  const [ano, mes, dia] = datePart.split("-");

  if (!ano || !mes || !dia) {
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}
