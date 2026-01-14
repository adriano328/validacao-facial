import * as Dialog from "@radix-ui/react-dialog";
import { useEffect } from "react";

type SuccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoCloseMs?: number; // opcional
  onAutoClose?: () => void; // opcional
};

export function SuccessDialog({
  open,
  onOpenChange,
  autoCloseMs,
  onAutoClose,
}: SuccessDialogProps) {
  useEffect(() => {
    if (!open) return;
    if (!autoCloseMs) return;

    const t = window.setTimeout(() => {
      onOpenChange(false);
      onAutoClose?.();
    }, autoCloseMs);

    return () => window.clearTimeout(t);
  }, [open, autoCloseMs, onOpenChange, onAutoClose]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={styles.overlay} />
        <Dialog.Content style={styles.content}>
          <div style={styles.iconWrap}>
            <AnimatedCheck />
          </div>

          <Dialog.Title style={styles.title}>
            Cadastro validado com sucesso!
          </Dialog.Title>

          <Dialog.Description style={styles.desc}>
            Você será direcionado para a próxima etapa.
          </Dialog.Description>

          <div style={styles.actions}>
            <Dialog.Close asChild>
              <button style={styles.button}>Continuar</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AnimatedCheck() {
  return (
    <svg
      width="84"
      height="84"
      viewBox="0 0 84 84"
      role="img"
      aria-label="Sucesso"
      style={styles.svg}
    >
      <circle
        cx="42"
        cy="42"
        r="34"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        style={styles.circle}
      />
      <path
        d="M26 44 L37 54 L58 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={styles.check}
      />
      <style>
        {`
          @keyframes popIn {
            0% { transform: scale(.92); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes drawCircle {
            0% { stroke-dashoffset: 220; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes drawCheck {
            0% { stroke-dashoffset: 80; opacity: 0; }
            30% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 1; }
          }
        `}
      </style>
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
  },
  content: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "min(420px, 92vw)",
    background: "white",
    borderRadius: 14,
    padding: 22,
    boxShadow: "0 20px 60px rgba(0,0,0,.25)",
  },
  iconWrap: {
    display: "grid",
    placeItems: "center",
    marginBottom: 10,
    color: "#16a34a", // verde (ajuste se quiser)
  },
  svg: {
    animation: "popIn 240ms ease-out",
  },
  circle: {
    strokeDasharray: 220,
    strokeDashoffset: 220,
    animation: "drawCircle 520ms ease-out forwards",
  },
  check: {
    strokeDasharray: 80,
    strokeDashoffset: 80,
    animation: "drawCheck 420ms 220ms ease-out forwards",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 6,
  },
  desc: {
    fontSize: 14,
    opacity: 0.85,
    textAlign: "center",
    marginTop: 6,
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    marginTop: 16,
  },
  button: {
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
    background: "#111827",
    color: "white",
  },
};
