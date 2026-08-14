import { useRef } from "react";
import { useTwoFactorConfirm } from "@features/two-factor/model/useTwoFactorConfirm";
import logoUrl from "@shared/assets/comademat-logo.png";
import "./TwoFactorConfirm.css";

type TwoFactorConfirmProps = {
  open: boolean;
  password?: string;
  onBack: () => void;
  onDone: () => void;
};

const CODE_LENGTH = 6;

export function TwoFactorConfirm({ open, password, onBack, onDone }: TwoFactorConfirmProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    code,
    onChangeCode,
    onBlurCode,
    error,
    canSubmit,
    isSubmitting,
    confirm,
  } = useTwoFactorConfirm({ password });

  if (!open) return null;

  const codeSlots = Array.from({ length: CODE_LENGTH }, (_, index) => code[index] ?? "");
  const activeSlot = Math.min(code.length, CODE_LENGTH - 1);

  async function handleConfirm() {
    const ok = await confirm();
    if (ok) onDone();
  }

  return (
    <div className="twofaModal" role="dialog" aria-modal="true" aria-labelledby="twofa-title">
      <div className="twofaBackdrop" />

      <form
        className="twofaCard"
        onSubmit={(event) => {
          event.preventDefault();
          void handleConfirm();
        }}
      >
        <img className="twofaLogo" src={logoUrl} alt="COMADEMAT" />

        <h1 className="twofaTitle" id="twofa-title">
          Portal de Eleições COMADEMAT
        </h1>

        <p className="twofaHint">
          Abra o Google Authenticator e insira o código de 6 dígitos gerado para este acesso.
        </p>

        <div
          className="twofaCodeWrap"
          onClick={() => inputRef.current?.focus()}
          aria-label="Código do Google Authenticator"
        >
          <input
            ref={inputRef}
            className="twofaCodeInput"
            value={code}
            onChange={(event) => onChangeCode(event.target.value)}
            onBlur={onBlurCode}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            autoFocus
          />

          {codeSlots.map((digit, index) => (
            <span
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className={[
                "twofaDigit",
                digit ? "twofaDigit--filled" : "",
                index === activeSlot && !isSubmitting ? "twofaDigit--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {digit || "•"}
            </span>
          ))}
        </div>

        {error ? <span className="twofaError">{error}</span> : null}

        <button className="twofaPrimary" type="submit" disabled={!canSubmit}>
          {isSubmitting ? (
            <>
              <span className="twofaSpinner" aria-hidden="true" />
              Validando...
            </>
          ) : (
            "Confirmar"
          )}
        </button>

        <button className="twofaSecondary" type="button" onClick={onBack} disabled={isSubmitting}>
          Cancelar
        </button>


        <footer className="twofaFooter">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2 5 5v6c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V5l-7-3Zm-1 13.2-3-3 1.4-1.4 1.6 1.6 3.8-3.8 1.4 1.4-5.2 5.2Z" />
          </svg>
          Conexão segura
        </footer>
      </form>
    </div>
  );
}
