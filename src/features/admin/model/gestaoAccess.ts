import {
  hasAllowedRole,
  type TipoUsuario,
} from "@features/user/model/permissions";

export const gestaoAllowedRoles: TipoUsuario[] = ["MEMBRO_CPE", "ADMIN_CPE"];
export const gestaoAdminRoles: TipoUsuario[] = ["ADMIN_CPE"];

export function canAccessGestao(tipoUsuario: TipoUsuario | string | number | null | undefined) {
  return hasAllowedRole(tipoUsuario, gestaoAllowedRoles);
}

export function canAccessGestaoAdmin(
  tipoUsuario: TipoUsuario | string | number | null | undefined
) {
  return hasAllowedRole(tipoUsuario, gestaoAdminRoles);
}
