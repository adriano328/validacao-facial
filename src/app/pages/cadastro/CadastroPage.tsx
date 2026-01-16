import "../../../styles/globalStyles.css";
import { useCadastroForm } from "../../../features/cadastro/useCadastroForm";
import { FormField } from "../../../components/form/FormField";
import { DropdownField } from "../../../components/dropdown/DropdownField";
import { MUNICIPIOS_MT } from "../../../data/municipiosMt";
import { maskDateBR, maskPhoneBR } from "../../../utils/masks";
import "./styles.css"

export function CadastroPage() {
  const { formCadastro, setFormCadastro, touchField, showError, handleCadastrar, isSubmitting } =
    useCadastroForm();

  const municipioError = showError("municipioResidencia");
  const municipioInvalid = !!municipioError;

  const municipioCongrecaoError = showError("municipioCongregacao");
  const municipioCongrecaoInvalid = !!municipioCongrecaoError;

  return (
    <div className="safe">
      <div className="container">
        <h1 className="titulo">Criar Cadastro</h1>

        <FormField label="Nome" required error={showError("nome")}>
          <input
            className="campo"
            value={formCadastro.nome}
            onChange={(e) => setFormCadastro("nome", e.target.value)}
            onBlur={() => touchField("nome")}
            placeholder="Seu nome completo"
          />
        </FormField>

        <FormField label="Data de nascimento" required error={showError("dataNascimento")}>
          <input
            className="campo"
            value={formCadastro.dataNascimento}
            onChange={(e) => setFormCadastro("dataNascimento", maskDateBR(e.target.value))}
            onBlur={() => touchField("dataNascimento")}
            placeholder="DD/MM/AAAA"
            inputMode="numeric"
          />
        </FormField>

        <FormField label="Telefone" required error={showError("telefone")}>
          <input
            className="campo"
            value={formCadastro.telefone}
            onChange={(e) => setFormCadastro("telefone", maskPhoneBR(e.target.value))}
            onBlur={() => touchField("telefone")}
            placeholder="(00) 00000-0000"
            inputMode="numeric"
          />
        </FormField>

        <FormField label="Endereço" required error={showError("endereco")}>
          <input
            className="campo"
            value={formCadastro.endereco}
            onChange={(e) => setFormCadastro("endereco", e.target.value)}
            onBlur={() => touchField("endereco")}
            placeholder="Rua/Av."
          />
        </FormField>

        <FormField label="Bairro" required error={showError("bairro")}>
          <input
            className="campo"
            value={formCadastro.bairro}
            onChange={(e) => setFormCadastro("bairro", e.target.value)}
            onBlur={() => touchField("bairro")}
            placeholder="Bairro"
          />
        </FormField>

        <FormField label="N°" required error={showError("numero")}>
          <input
            className="campo"
            value={formCadastro.numero}
            onChange={(e) => setFormCadastro("numero", e.target.value.replace(/\D/g, ""))}
            onBlur={() => touchField("numero")}
            placeholder="Número"
            inputMode="numeric"
          />
        </FormField>

        <FormField label="Complemento" error={showError("complemento")}>
          <input
            className="campo"
            value={formCadastro.complemento}
            onChange={(e) => setFormCadastro("complemento", e.target.value)}
            onBlur={() => touchField("complemento")}
            placeholder="Complemento"
          />
        </FormField>

        <FormField label="Município de Residência" required error={municipioError}>
          <DropdownField
            value={formCadastro.municipioResidencia}
            placeholder="Selecione o município"
            options={MUNICIPIOS_MT}
            searchable
            searchPlaceholder="Buscar município..."
            emptyText="Nada encontrado 😅"
            onChange={(municipio) => setFormCadastro("municipioResidencia", municipio)}
            onBlur={() => touchField("municipioResidencia")}
            invalid={municipioInvalid}
          />
        </FormField>

        <FormField label="Município de Congregação" required error={municipioCongrecaoError}>
          <DropdownField
            value={formCadastro.municipioCongregacao}
            placeholder="Selecione o município"
            options={MUNICIPIOS_MT}
            searchable
            searchPlaceholder="Buscar município..."
            emptyText="Nada encontrado 😅"
            onChange={(municipio) => setFormCadastro("municipioCongregacao", municipio)}
            onBlur={() => touchField("municipioCongregacao")}
            invalid={municipioCongrecaoInvalid}
          />
        </FormField>

        <FormField required label="Atividade Profissional" error={showError("atividadeProfissional")}>
          <input
            className="campo"
            value={formCadastro.atividadeProfissional}
            onChange={(e) => setFormCadastro("atividadeProfissional", e.target.value)}
            onBlur={() => touchField("atividadeProfissional")}
          />
        </FormField>

        <FormField required label="Setor Congregação" error={showError("setorCongregacao")}>
          <input
            className="campo"
            value={formCadastro.setorCongregacao}
            onChange={(e) => setFormCadastro("setorCongregacao", e.target.value)}
            onBlur={() => touchField("setorCongregacao")}
          />
        </FormField>

        <FormField required label="Cargo Eclesiastico" error={showError("cargoEclesiastico")}>
          <input
            className="campo"
            value={formCadastro.cargoEclesiastico}
            onChange={(e) => setFormCadastro("cargoEclesiastico", e.target.value)}
            onBlur={() => touchField("cargoEclesiastico")}
          />
        </FormField>

        <FormField label="E-mail" required error={showError("email")}>
          <input
            className="campo"
            value={formCadastro.email}
            onChange={(e) => setFormCadastro("email", e.target.value)}
            onBlur={() => touchField("email")}
            placeholder="seuemail@seuemail.com"
            inputMode="email"
            autoCapitalize="none"
          />
        </FormField>

        <FormField label="Senha" required error={showError("senha")}>
          <input
            className="campo"
            type="password"
            value={formCadastro.senha}
            onChange={(e) => setFormCadastro("senha", e.target.value)}
            onBlur={() => touchField("senha")}
            placeholder="••••••••"
          />
        </FormField>

        <FormField label="Confirmar senha" required error={showError("senhaConfirmacao")}>
          <input
            className="campo"
            type="password"
            value={formCadastro.senhaConfirmacao}
            onChange={(e) => setFormCadastro("senhaConfirmacao", e.target.value)}
            onBlur={() => touchField("senhaConfirmacao")}
            placeholder="••••••••"
          />
        </FormField>

        <div className="containerBotao">
          <button className="botao" type="button" onClick={handleCadastrar} disabled={isSubmitting}>
            <span className="textoBotao">{isSubmitting ? "Salvando..." : "Cadastrar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
