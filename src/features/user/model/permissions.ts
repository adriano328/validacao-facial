export type TipoUsuario = "VOTANTE" | "MEMBRO_CPE" | "ADMIN_CPE";

type TipoUsuarioInput = TipoUsuario | string | number | null | undefined;

const tipoUsuarioPorOrdinal: Record<number, TipoUsuario> = {
  0: "VOTANTE",
  1: "MEMBRO_CPE",
  2: "ADMIN_CPE",
};

const tipoUsuarioLabels: Record<TipoUsuario, string> = {
  VOTANTE: "Votante",
  MEMBRO_CPE: "Membro CPE",
  ADMIN_CPE: "Admin CPE",
};

export function normalizeTipoUsuario(value: TipoUsuarioInput): TipoUsuario {
  if (typeof value === "number") {
    return tipoUsuarioPorOrdinal[value] ?? "VOTANTE";
  }

  const normalized = String(value ?? "VOTANTE")
    .trim()
    .toUpperCase();

  if (normalized === "MEMBRO_CPE" || normalized === "ADMIN_CPE") {
    return normalized;
  }

  return "VOTANTE";
}

export function getTipoUsuarioLabel(value: TipoUsuarioInput): string {
  return tipoUsuarioLabels[normalizeTipoUsuario(value)];
}

export function canAccessIdentity(value: TipoUsuarioInput): boolean {
  const tipoUsuario = normalizeTipoUsuario(value);
  return tipoUsuario === "MEMBRO_CPE" || tipoUsuario === "ADMIN_CPE";
}

export function canManagePrivileges(value: TipoUsuarioInput): boolean {
  return normalizeTipoUsuario(value) === "ADMIN_CPE";
}

export function hasAllowedRole(
  value: TipoUsuarioInput,
  allowedRoles: TipoUsuario[]
): boolean {
  return allowedRoles.includes(normalizeTipoUsuario(value));
}
