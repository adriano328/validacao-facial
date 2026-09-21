import { useNavigate } from "react-router-dom";
import "./GestaoPageActions.css";

type ActionButtonProps = {
  className?: string;
};

type ClearFiltersButtonProps = ActionButtonProps & {
  disabled: boolean;
  onClick: () => void;
};

export function GestaoBackButton({ className }: ActionButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      className={["gestao-backButton", className].filter(Boolean).join(" ")}
      type="button"
      aria-label="Voltar para Gestão"
      onClick={() => navigate("/gestao")}
    >
      <span aria-hidden="true">←</span>
      Voltar
    </button>
  );
}

export function ClearFiltersButton({
  className,
  disabled,
  onClick,
}: ClearFiltersButtonProps) {
  return (
    <button
      className={["gestao-clearFiltersButton", className].filter(Boolean).join(" ")}
      type="button"
      aria-label="Limpar filtros"
      onClick={onClick}
      disabled={disabled}
    >
      <span aria-hidden="true">×</span>
      Limpar filtros
    </button>
  );
}
