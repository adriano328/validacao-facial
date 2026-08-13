import { FacePhotoField } from "@features/registration/ui/FacePhotoField";
import { DocumentPhotoField } from "@features/registration/ui/DocumentPhotoField";
import { useCadastroForm } from "@features/registration/model/useCadastroForm";
import type { CargoUsuario } from "@features/registration/model/types";
import { CARGOS_ECLESIASTICOS } from "@shared/data/cargos";
import { BrandMark } from "@shared/ui/brand/BrandMark";
import { DropdownField } from "@shared/ui/dropdown/DropdownField";
import { FormField } from "@shared/ui/form/FormField";
import { SectionHeader } from "@shared/ui/section-header/SectionHeader";
import { maskCPF, maskDateBR, maskPhoneBR } from "@shared/utils/masks";
import "./CadastroPage.css";

function BallotIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="34"
      height="34"
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9 21.5V25C9 26.1 9.9 27 11 27H25C26.1 27 27 26.1 27 25V21.5"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 20.5H15.8"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <path
        d="M17.6 8.6L24.4 15.4L15 24.8H8.2V18L17.6 8.6Z"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.4 10.8L22.2 17.6"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CadastroPage() {
  const {
    formCadastro,
    setFormCadastro,
    touchField,
    showError,
    handleConsultaCpf,
    handleCadastrar,
    isSubmitting,
  } = useCadastroForm();

  const cargoError = showError("cargo");
  const cargoInvalid = !!cargoError;

  return (
    <div className="cadastro-page">
      <main className="cadastro-main" aria-labelledby="cadastro-title">
        <BrandMark className="cadastro-brand" subtitle="" />

        <section className="vf-card cadastro-card">
          <SectionHeader
            className="cadastro-cardHeader"
            id="cadastro-title"
            title="Criar Cadastro"
            titleAs="h4"
            subtitle="Preencha os campos abaixo para iniciar seu acesso seguro à plataforma."
          />

          <div className="cadastro-form">
            <div className="cadastro-grid">
              <FormField label="CPF" required error={showError("cpf")}>
                <input
                  className="vf-input"
                  value={formCadastro.cpf}
                  onChange={(event) =>
                    setFormCadastro("cpf", maskCPF(event.target.value))
                  }
                  onBlur={() => {
                    touchField("cpf");
                    handleConsultaCpf(formCadastro.cpf);
                  }}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
              </FormField>

              <FormField label="Nome" required error={showError("nome")}>
                <input
                  className="vf-input"
                  value={formCadastro.nome}
                  onChange={(event) =>
                    setFormCadastro("nome", event.target.value)
                  }
                  onBlur={() => touchField("nome")}
                  placeholder="Nome completo"
                />
              </FormField>

              <FormField
                label="Data de nascimento"
                required
                error={showError("dataNascimento")}
              >
                <input
                  className="vf-input"
                  value={formCadastro.dataNascimento}
                  onChange={(event) =>
                    setFormCadastro(
                      "dataNascimento",
                      maskDateBR(event.target.value)
                    )
                  }
                  onBlur={() => touchField("dataNascimento")}
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                />
              </FormField>

              <FormField label="Telefone" required error={showError("telefone")}>
                <input
                  className="vf-input"
                  value={formCadastro.telefone}
                  onChange={(event) =>
                    setFormCadastro("telefone", maskPhoneBR(event.target.value))
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
                  onChange={(cargo) =>
                    setFormCadastro("cargo", cargo as CargoUsuario)
                  }
                  onBlur={() => touchField("cargo")}
                  invalid={cargoInvalid}
                />
              </FormField>

              <FormField label="E-mail" required error={showError("email")}>
                <input
                  className="vf-input"
                  value={formCadastro.email}
                  onChange={(event) =>
                    setFormCadastro("email", event.target.value)
                  }
                  onBlur={() => touchField("email")}
                  placeholder="seuemail@seuemail.com"
                  inputMode="email"
                  autoCapitalize="none"
                />
              </FormField>

              <FormField label="Senha" required error={showError("senha")}>
                <input
                  className="vf-input"
                  type="password"
                  value={formCadastro.senha}
                  onChange={(event) =>
                    setFormCadastro("senha", event.target.value)
                  }
                  onBlur={() => touchField("senha")}
                />
              </FormField>

              <FormField
                label="Confirmar senha"
                required
                error={showError("senhaConfirmacao")}
              >
                <input
                  className="vf-input"
                  type="password"
                  value={formCadastro.senhaConfirmacao}
                  onChange={(event) =>
                    setFormCadastro("senhaConfirmacao", event.target.value)
                  }
                  onBlur={() => touchField("senhaConfirmacao")}
                />
              </FormField>
            </div>

            <FacePhotoField
              value={formCadastro.foto}
              onChange={(base64) => setFormCadastro("foto", base64)}
              required
              error={showError("foto")}
            />

            <DocumentPhotoField
              label="Foto do documento"
              documentType="RG"
              value={formCadastro.fotoDocumento}
              onChange={(base64) => setFormCadastro("fotoDocumento", base64)}
              required
              error={showError("fotoDocumento")}
            />

            <button
              className="vf-button vf-button--primary cadastro-submit"
              type="button"
              onClick={handleCadastrar}
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? "Salvando..." : "Cadastrar"}</span>
              <BallotIcon className="cadastro-buttonIcon" />
            </button>

            <p className="cadastro-terms">
              Ao clicar em Cadastrar, você concorda com nossos{" "}
              <a href="/termos" onClick={(event) => event.preventDefault()}>
                Termos de Uso
              </a>{" "}
              e{" "}
              <a href="/privacidade" onClick={(event) => event.preventDefault()}>
                Política de Privacidade
              </a>
              .
            </p>
          </div>
        </section>

        <footer className="cadastro-footer">
          <p>© 2024 COMADEMAT. Todos os direitos reservados.</p>
          <p>Sistema de Auditoria Civil Independente.</p>
        </footer>
      </main>
    </div>
  );
}
