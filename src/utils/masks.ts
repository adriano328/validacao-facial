const onlyDigits = (v: string) => v.replace(/\D/g, "");

export function maskDateBR(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 4);
  const p3 = d.slice(4, 8);
  return [p1, p2, p3].filter(Boolean).join("/");
}

export function maskPhoneBR(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  const ddd = d.slice(0, 2);

  if (d.length <= 10) {
    const p1 = d.slice(2, 6);
    const p2 = d.slice(6, 10);
    return [ddd ? `(${ddd})` : "", p1, p2 ? `-${p2}` : ""].join(" ").trim();
  }

  const p1 = d.slice(2, 7);
  const p2 = d.slice(7, 11);
  return [ddd ? `(${ddd})` : "", p1, p2 ? `-${p2}` : ""].join(" ").trim();
}
