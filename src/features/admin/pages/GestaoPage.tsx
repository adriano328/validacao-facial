import {
  canAccessGestao,
  canAccessGestaoAdmin,
} from "@features/admin/model/gestaoAccess";
import {
  GestaoHubCard,
  type GestaoHubIcon,
} from "@features/admin/ui/GestaoHubCard";
import { useUserInfo } from "@features/user/model/UserInfoContext";
import "@features/user/pages/HomePage.css";
import "./GestaoPage.css";

type GestaoItem = {
  title: string;
  description: string;
  icon: GestaoHubIcon;
  to: string;
  visible: boolean;
};

export function GestaoPage() {
  const { usuario } = useUserInfo();
  const tipoUsuario = usuario?.tipoUsuario;

  const gestaoItems: GestaoItem[] = [
    {
      title: "Confirmação de Identidade",
      description: "Analise os cadastros enviados pelos membros.",
      icon: "fingerprint",
      to: "/cpe/confirmacao-identidade",
      visible: canAccessGestao(tipoUsuario),
    },
    {
      title: "Membros",
      description: "Consulte e gerencie os membros cadastrados.",
      icon: "users",
      to: "/membros",
      visible: canAccessGestao(tipoUsuario),
    },
    {
      title: "Gestão de Privilégios",
      description: "Gerencie os níveis de acesso dos membros.",
      icon: "shield",
      to: "/administracao/privilegios",
      visible: canAccessGestaoAdmin(tipoUsuario),
    },
    {
      title: "Gestão de Cargos",
      description: "Gerencie os cargos disponíveis nas convenções.",
      icon: "briefcase",
      to: "/administracao/cargos",
      visible: canAccessGestaoAdmin(tipoUsuario),
    },
    {
      title: "Convenções",
      description: "Consulte as convenções cadastradas no sistema.",
      icon: "building",
      to: "/gestao/convencoes",
      visible: canAccessGestao(tipoUsuario),
    },
    {
      title: "Parâmetros",
      description: "Configure os cargos vinculados às funções da CPE por convenção.",
      icon: "sliders",
      to: "/gestao/parametros",
      visible: canAccessGestaoAdmin(tipoUsuario),
    },
    {
      title: "Comissão CPE",
      description: "Gerencie os membros e cargos administrativos da Comissão CPE.",
      icon: "committee",
      to: "/gestao/comissao-cpe",
      visible: canAccessGestaoAdmin(tipoUsuario),
    },
    {
      title: "Mesa Diretora",
      description: "Gerencie os membros e cargos da Mesa Diretora.",
      icon: "board",
      to: "/gestao/mesa-diretora",
      visible: canAccessGestaoAdmin(tipoUsuario),
    },
  ];

  return (
    <section className="portal-page gestao-page" aria-labelledby="gestao-title">
      <header className="portal-pageHeader">
        <h1 id="gestao-title">Gestão</h1>
        <p>Gerencie as configurações, usuários e recursos administrativos do sistema.</p>
      </header>

      <section className="home-quick" aria-labelledby="gestao-recursos-title">
        <div className="home-quickGrid">
          {gestaoItems
            .filter((item) => item.visible)
            .map((item) => (
              <GestaoHubCard
                description={item.description}
                icon={item.icon}
                key={item.to}
                title={item.title}
                to={item.to}
              />
            ))}
        </div>
      </section>
    </section>
  );
}
