import { FormField } from "../form/FormField";
import "./styles.css";

type ConfirmPasswordStepProps = {
  senha: string;
  senhaConfirmacao: string;
  setSenhaConfirmacao: (value: string) => void;
  touchField: () => void;
  error?: string;
  isSubmitting?: boolean;
  onSubmit: () => void;
};

export function ConfirmPasswordStep({
  senha,
  senhaConfirmacao,
  setSenhaConfirmacao,
  touchField,
  error,
  isSubmitting = false,
  onSubmit,
}: ConfirmPasswordStepProps) {
  const senhasDiferentes =
    senhaConfirmacao.length > 0 && senha !== senhaConfirmacao;

  const mensagemErro =
    error ||
    (senhasDiferentes ? "As senhas não coincidem." : undefined);

  return (
    <div className="safe">
      <div className="container">
        <h1 className="titulo">Confirmar senha</h1>

        <FormField  
          label="Confirmar senha"
          required
          error={mensagemErro}
        >
          <input
            className="campo"
            type="password"
            value={senhaConfirmacao}
            onChange={(e) => setSenhaConfirmacao(e.target.value)}
            onBlur={touchField}
            placeholder="••••••••"
          />
        </FormField>

        <div className="containerBotao">
          <button
            className="botao"
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || senhasDiferentes || !senhaConfirmacao}
          >
            <span className="textoBotao">
              {isSubmitting ? "Confirmando..." : "Confirmar"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}