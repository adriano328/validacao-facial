import "../../../styles/globalStyles.css";
import { FormField } from "../../../components/form/FormField";
import { useLoginForm } from "../../../features/login/useLoginForm";
import "./styles.css";

export function LoginPage() {
  const { formLogin, setFormLogin, touchField, showError, handleLogin, irCadastrar,isSubmitting } = useLoginForm();

  return (
    <div className="safe">
      <div className="container">
        <h1 className="titulo">Entrar</h1>

        <FormField label="E-mail" required error={showError("email")}>
          <input
            className="campo"
            value={formLogin.email}
            onChange={(e) => setFormLogin("email", e.target.value)}
            onBlur={() => touchField("email")}
            placeholder="seuemail@seuemail.com"
            inputMode="email"
            autoCapitalize="none"
            autoComplete="email"
          />
        </FormField>

        <FormField label="Senha" required error={showError("password")}>
          <input
            className="campo"
            type="password"
            value={formLogin.password}
            onChange={(e) => setFormLogin("password", e.target.value)}
            onBlur={() => touchField("password")}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </FormField>

        <div className="containerBotao">
          <button className="botao cadastrar" type="button" onClick={irCadastrar}>
            <span className="textoBotao">Cadastrar</span>
          </button>
          <button className="botao entrar" type="button" onClick={irCadastrar} disabled={isSubmitting}>
            <span className="textoBotao">{isSubmitting ? "Entrando..." : "Entrar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
