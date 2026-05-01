// src/lib/alerts.ts
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

type AlertOptions = {
  title?: string;
  text?: string;
  timer?: number;
};

export const alerts = {
  // ⏳ Processando
  loading: (opts?: { title?: string; text?: string }) => {
    MySwal.fire({
      title: opts?.title ?? "Processando...",
      text: opts?.text ?? "Aguarde um momento",
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        title: "swal-small-title",
        htmlContainer: "swal-small-text",
        icon: "swal-small-icon",
        confirmButton: "swal-small-button",
      },
      didOpen: () => {
        MySwal.showLoading();
      },
    });
  },

  // fechar qualquer alert (inclusive loading)
  close: () => {
    MySwal.close();
  },

  // ✅ Sucesso
  success: (opts?: AlertOptions) => {
    return MySwal.fire({
      icon: "success",
      title: opts?.title ?? "Sucesso!",
      text: opts?.text,
      showConfirmButton: false,
      timer: opts?.timer ?? 1800,
      timerProgressBar: true,
      customClass: {
        title: "swal-small-title",
        htmlContainer: "swal-small-text",
        icon: "swal-small-icon",
        confirmButton: "swal-small-button",
      },
    });
  },

  // ⚠️ Warning
  warn: (opts?: AlertOptions) => {
    return MySwal.fire({
      icon: "warning",
      title: opts?.title ?? "Atenção",
      text: opts?.text ?? "Verifique as informações antes de continuar.",
      timer: opts?.timer ?? 1800,
      customClass: {
        title: "swal-small-title",
        htmlContainer: "swal-small-text",
        icon: "swal-small-icon",
        confirmButton: "swal-small-button",
      },
    });
  },

  // ❌ Erro
  error: (opts?: AlertOptions) => {
    return MySwal.fire({
      icon: "error",
      title: opts?.title ?? "Atenção",
      text: opts?.text ?? "Ocorreu um erro. Tente novamente.",
      confirmButtonText: "Ok",
      customClass: {
        title: "swal-small-title",
        htmlContainer: "swal-small-text",
        icon: "swal-small-icon",
        confirmButton: "swal-small-button",
      },
    });
  },
};
