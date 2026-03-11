import "../../../styles/globalStyles.css";
import { useCadastroForm } from "../../../features/cadastro/useCadastroForm";
import type { CargoUsuario } from "../../../features/cadastro/types";
import { FormField } from "../../../components/form/FormField";
import { DropdownField } from "../../../components/dropdown/DropdownField";
import { maskCPF, maskDateBR, maskPhoneBR } from "../../../utils/masks";
import "./styles.css";
import { DocumentPhotoField } from "../documentVerify/DocumentPhotoField";
import { CARGOS_ECLESIASTICOS } from "../../../data/cargos";
import { ConfirmPasswordStep } from "../../../components/ConfirmPasswordStep/ConfirmPasswordStep";

export function CadastroPage() {
  const {
    formCadastro,
    setFormCadastro,
    touchField,
    showError,
    handleCadastrar,
    handleConfirmarSenha,
    isSubmitting,
    step,
  } = useCadastroForm();

  const cargoError = showError("cargo");
  const cargoInvalid = !!cargoError;

  if (step === "confirmarSenha") {
    return (
      <ConfirmPasswordStep
        senha={formCadastro.senha}
        senhaConfirmacao={formCadastro.senhaConfirmacao}
        setSenhaConfirmacao={(value) =>
          setFormCadastro("senhaConfirmacao", value)
        }
        touchField={() => touchField("senhaConfirmacao")}
        error={showError("senhaConfirmacao")}
        isSubmitting={isSubmitting}
        onSubmit={handleConfirmarSenha}
      />
    );
  }

  return (
    <div className="safe">
      <div className="container">
        <h1 className="titulo">Criar Cadastro</h1>

        <FormField label="CPF" required error={showError("cpf")}>
          <input
            className="campo"
            value={formCadastro.cpf}
            onChange={(e) => setFormCadastro("cpf", maskCPF(e.target.value))}
            onBlur={() => touchField("cpf")}
            placeholder="000.000.000-00"
            inputMode="numeric"
          />
        </FormField>

        <FormField label="Nome" required error={showError("nome")}>
          <input
            className="campo"
            value={formCadastro.nome}
            onChange={(e) => setFormCadastro("nome", e.target.value)}
            onBlur={() => touchField("nome")}
            placeholder="Seu nome completo"
          />
        </FormField>

        <FormField
          label="Data de nascimento"
          required
          error={showError("dataNascimento")}
        >
          <input
            className="campo"
            value={formCadastro.dataNascimento}
            onChange={(e) =>
              setFormCadastro("dataNascimento", maskDateBR(e.target.value))
            }
            onBlur={() => touchField("dataNascimento")}
            placeholder="DD/MM/AAAA"
            inputMode="numeric"
          />
        </FormField>

        <FormField label="Telefone" required error={showError("telefone")}>
          <input
            className="campo"
            value={formCadastro.telefone}
            onChange={(e) =>
              setFormCadastro("telefone", maskPhoneBR(e.target.value))
            }
            onBlur={() => touchField("telefone")}
            placeholder="(00) 00000-0000"
            inputMode="numeric"
          />
        </FormField>

        <FormField required label="Cargo" error={cargoError}>
          <DropdownField
            value={formCadastro.cargo}
            placeholder="Selecione o cargo"
            options={CARGOS_ECLESIASTICOS}
            onChange={(cargo) => setFormCadastro("cargo", cargo as CargoUsuario)}
            onBlur={() => touchField("cargo")}
            invalid={cargoInvalid}
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

        <FormField
          label="Confirmar senha"
          required
          error={showError("senhaConfirmacao")}
        >
          <input
            className="campo"
            type="password"
            value={formCadastro.senhaConfirmacao}
            onChange={(e) =>
              setFormCadastro("senhaConfirmacao", e.target.value)
            }
            onBlur={() => touchField("senhaConfirmacao")}
            placeholder="••••••••"
          />
        </FormField>

        <DocumentPhotoField
          documentType="CNH"
          value={formCadastro.documento}
          onChange={(base64) => setFormCadastro("documento", base64)}
          required
          error={showError("documento")}
        />

        <div className="containerBotao">
          <button
            className="botao"
            type="button"
            onClick={handleCadastrar}
            disabled={isSubmitting}
          >
            <span className="textoBotao">
              {isSubmitting ? "Salvando..." : "Cadastrar"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}