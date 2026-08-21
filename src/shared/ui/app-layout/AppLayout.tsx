import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthToken } from "@features/auth/model/AuthTokenContext";
import { useUserInfo } from "@features/user/model/UserInfoContext";
import {
  canAccessIdentity,
  canManagePrivileges,
  getTipoUsuarioLabel,
} from "@features/user/model/permissions";
import logoUrl from "@shared/assets/comademat-logo.png";
import { MemberAvatar } from "@shared/ui/member-avatar/MemberAvatar";
import "./AppLayout.css";

type NavItem = {
  label: string;
  to: string;
  icon: "home" | "vote" | "user" | "fingerprint" | "shield" | "key";
  visible?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

function Icon({ name }: { name: NavItem["icon"] }) {
  const paths: Record<NavItem["icon"], string> = {
    home: "M4 10.4 12 4l8 6.4V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.6Zm2 .9V19h2v-6h8v6h2v-7.7l-6-4.8-6 4.8Z",
    vote: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v12h12V6H6Zm2 2h4v2H8V8Zm0 4h8v2H8v-2Z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 4.6V20h14v-1.4C19 16 16 14 12 14Z",
    fingerprint: "M12 3c3.4 0 6 2.3 6 5.5h-2C16 6.4 14.3 5 12 5S8 6.4 8 8.5c0 1.2-.2 2.7-.8 4.5l-1.9-.6c.5-1.6.7-2.9.7-3.9C6 5.3 8.6 3 12 3Zm0 4c1.3 0 2 .7 2 1.7 0 3.8-1.2 6.8-3.8 9.6l-1.5-1.3c2.3-2.5 3.3-5 3.3-8.3 0-.1 0-.1-.1-.1-.9 0-1.4.5-1.4 1.4 0 2.4-.8 5-2.1 7.1l-1.7-1c1.1-1.8 1.8-4 1.8-6.1C8.5 8.2 9.9 7 12 7Zm4 2h2c0 4.6-1.4 8-4.3 11l-1.4-1.4C14.8 16 16 13.1 16 9Zm4 .3h2c-.1 4.5-1.6 8.3-4.3 11.2l-1.5-1.4c2.4-2.6 3.7-5.9 3.8-9.8Z",
    shield: "M12 3 5 6v5c0 4.4 2.8 8.3 7 9.8 4.2-1.5 7-5.4 7-9.8V6l-7-3Zm0 2.2 5 2.1V11c0 3.2-1.9 6.2-5 7.5-3.1-1.3-5-4.3-5-7.5V7.3l5-2.1Zm-1 8.5-2-2-1.4 1.4L11 16.5l5.4-5.4L15 9.7l-4 4Z",
    key: "M7.5 14A4.5 4.5 0 1 1 12 9.5c0 .6-.1 1.2-.3 1.7L20 19.5 18.5 21l-1.7-1.7-1.6 1.6-1.4-1.4 1.6-1.6-1.7-1.7-1.6 1.6-1.4-1.4 1.6-1.6-1.8-1.8c-.7.4-1.6.6-2.6.6ZM7.5 7A2.5 2.5 0 1 0 10 9.5 2.5 2.5 0 0 0 7.5 7Z",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname.includes("/votacao")) return "Cabine de Votação";
  if (pathname.includes("/minha-conta")) return "Minha Conta";
  if (pathname.includes("/membros")) return "Membros";
  if (pathname.includes("/cpe")) return "CPE";
  if (pathname.includes("/administracao")) return "Administração";
  return "Início";
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { clearToken } = useAuthToken();
  const { usuario } = useUserInfo();
  const navigate = useNavigate();
  const location = useLocation();

  const tipoUsuario = usuario?.tipoUsuario;
  const navGroups = useMemo<NavGroup[]>(
    () => [
      {
        label: "Principal",
        items: [{ label: "Início", to: "/home", icon: "home" }],
      },
      {
        label: "Votação",
        items: [
          { label: "Cabine de Votação", to: "/votacao/cabine", icon: "vote" },
        ],
      },
      {
        label: "Minha Conta",
        items: [
          {
            label: "Dados Pessoais",
            to: "/minha-conta/dados-pessoais",
            icon: "user",
          },
          {
            label: "Redefinir Senha",
            to: "/recuperar-senha",
            icon: "key",
          },
        ],
      },
      {
        label: "CPE",
        items: [
          {
            label: "Confirmação de Identidade",
            to: "/cpe/confirmacao-identidade",
            icon: "fingerprint",
            visible: canAccessIdentity(tipoUsuario),
          },
          {
            label: "Membros",
            to: "/membros",
            icon: "user",
            visible: canAccessIdentity(tipoUsuario),
          },
        ],
      },
      {
        label: "Administração",
        items: [
          {
            label: "Gestão de Privilégios",
            to: "/administracao/privilegios",
            icon: "shield",
            visible: canManagePrivileges(tipoUsuario),
          },
        ],
      },
    ],
    [tipoUsuario]
  );

  function handleLogout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  return (
    <div className="appLayout">
      <button
        className="appLayout-mobileBackdrop"
        type="button"
        aria-label="Fechar menu"
        hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`appLayout-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="appLayout-brand">
          <img className="appLayout-brandLogo" src={logoUrl} alt="COMADEMAT" />
          <strong>Portal de Eleições</strong>
          <span>COMADEMAT</span>
        </div>

        <nav className="appLayout-nav" aria-label="Navegação principal">
          {navGroups.map((group) => {
            const items = group.items.filter((item) => item.visible !== false);
            if (!items.length) return null;

            return (
              <section className="appLayout-navGroup" key={group.label}>
                <span className="appLayout-navGroupLabel">{group.label}</span>
                {items.map((item) => (
                  <NavLink
                    className={({ isActive }) =>
                      `appLayout-navLink ${isActive ? "is-active" : ""}`
                    }
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </section>
            );
          })}
        </nav>

        <div className="appLayout-sidebarFooter">
          <button className="appLayout-logout" type="button" onClick={handleLogout}>
            <Icon name="key" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="appLayout-body">
        <header className="appLayout-topbar">
          <button
            className="appLayout-menuButton"
            type="button"
            aria-label="Abrir menu"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

      
          <div className="appLayout-user">
            <div className="appLayout-userCopy">
              <strong>{usuario?.nome ?? "Usuário"}</strong>
              <span>{getTipoUsuarioLabel(tipoUsuario)}</span>
            </div>
            <MemberAvatar
              className="appLayout-avatar"
              src={usuario?.foto}
              fallback={usuario?.nome}
              size="sm"
            />
          </div>
        </header>

        <main className="appLayout-main" aria-label={getPageTitle(location.pathname)}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
