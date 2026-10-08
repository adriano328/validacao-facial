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

export function formatarDataHoraToBr(dataHora: string): string {
  if (!dataHora) return "—";

  const [datePart, timePart = ""] = dataHora.split("T");
  const data = formatarDataToBr(datePart);
  const hora = timePart.slice(0, 5);

  return hora ? `${data} ${hora}` : data;
}

export function formatarLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}
