import { Navigate, Outlet } from "react-router-dom";
import { useUserInfo } from "@features/user/model/UserInfoContext";
import {
  hasAllowedRole,
  type TipoUsuario,
} from "@features/user/model/permissions";

type RoleProtectedRouteProps = {
  allowedRoles: TipoUsuario[];
};

export function RoleProtectedRoute({ allowedRoles }: RoleProtectedRouteProps) {
  const { usuario, loading } = useUserInfo();

  if (loading) {
    return (
      <div className="appLayout-state" role="status">
        Carregando permissões...
      </div>
    );
  }

  if (!usuario || !hasAllowedRole(usuario.tipoUsuario, allowedRoles)) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
