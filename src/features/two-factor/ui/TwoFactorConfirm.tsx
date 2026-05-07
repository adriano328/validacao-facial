import { useRef } from "react";
import { useTwoFactorConfirm } from "@features/two-factor/model/useTwoFactorConfirm";
import "./TwoFactorConfirm.css";

type TwoFactorConfirmProps = {
  open: boolean;
  onBack: () => void;
  onDone: () => void;
};

const CODE_LENGTH = 6;

export function TwoFactorConfirm({ open, onBack, onDone }: TwoFactorConfirmProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    code,
    onChangeCode,
    onBlurCode,
    error,
    canSubmit,
    isSubmitting,
    confirm,
  } = useTwoFactorConfirm();

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
        <div className="twofaIcon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 10V8.2C7 5.3 9.2 3 12 3C14.8 3 17 5.3 17 8.2V10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M6.8 10H17.2C18.2 10 19 10.8 19 11.8V19.2C19 20.2 18.2 21 17.2 21H6.8C5.8 21 5 20.2 5 19.2V11.8C5 10.8 5.8 10 6.8 10Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 14.2V16.8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="twofaTitle" id="twofa-title">
          Confirmar código
        </h1>

        <p className="twofaHint">
          Insira o código de 6 dígitos gerado no seu aplicativo autenticador.
        </p>

        <div
          className="twofaCodeWrap"
          onClick={() => inputRef.current?.focus()}
          aria-label="Código do Authenticator"
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

        <p className="twofaSupport">
          Não consegue acessar o código?{" "}
          <button type="button" onClick={onBack} disabled={isSubmitting}>
            Tente outro método
          </button>
        </p>
      </form>
    </div>
  );
}
