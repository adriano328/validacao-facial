const onlyDigits = (v: string) => v.replace(/\D/g, "");

export function isValidCPF(cpf: string): boolean {
  const cleaned = onlyDigits(cpf);

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(cleaned[i]) * (10 - i);
  }

  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;

  if (firstDigit !== Number(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(cleaned[i]) * (11 - i);
  }

  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;

  return secondDigit === Number(cleaned[10]);
}