import { useState, type InputHTMLAttributes } from "react";
import "./PasswordInput.css";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {visible ? (
        <>
          <path d="M12 5c4.4 0 7.7 3.1 9.3 6.5.1.3.1.7 0 1C19.7 15.9 16.4 19 12 19s-7.7-3.1-9.3-6.5a1.2 1.2 0 0 1 0-1C4.3 8.1 7.6 5 12 5Zm0 2c-3.2 0-5.8 2.1-7.2 5 1.4 2.9 4 5 7.2 5s5.8-2.1 7.2-5C17.8 9.1 15.2 7 12 7Z" />
          <path d="M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
        </>
      ) : (
        <>
          <path d="m4.3 3 16.7 16.7-1.3 1.3-3-3A9.6 9.6 0 0 1 12 19c-4.4 0-7.7-3.1-9.3-6.5a1.2 1.2 0 0 1 0-1 12.4 12.4 0 0 1 3.5-4.4L3 4.3 4.3 3Zm3.3 5.5A10.5 10.5 0 0 0 4.8 12c1.4 2.9 4 5 7.2 5 1.2 0 2.3-.3 3.2-.8l-1.8-1.8A3 3 0 0 1 9.6 10.6l-2-2Z" />
          <path d="M12 5c4.4 0 7.7 3.1 9.3 6.5.1.3.1.7 0 1a12 12 0 0 1-2.1 3.2l-1.4-1.4c.6-.7 1.1-1.5 1.4-2.3-1.4-2.9-4-5-7.2-5-.8 0-1.6.1-2.3.4L8.2 6.4A9.4 9.4 0 0 1 12 5Z" />
        </>
      )}
    </svg>
  );
}

export function PasswordInput({ className, disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="passwordInput">
      <input
        {...props}
        className={["passwordInput-field", className].filter(Boolean).join(" ")}
        disabled={disabled}
        type={visible ? "text" : "password"}
      />
      <button
        className="passwordInput-toggle"
        type="button"
        disabled={disabled}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setVisible((current) => !current)}
      >
        <EyeIcon visible={visible} />
      </button>
    </div>
  );
}
