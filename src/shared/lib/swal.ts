// src/lib/alerts.ts
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const compactSweetAlertClasses = {
  popup: "swal-small-popup",
  title: "swal-small-title",
  htmlContainer: "swal-small-text",
  icon: "swal-small-icon",
  confirmButton: "swal-small-button",
  cancelButton: "swal-small-button",
  actions: "swal-small-actions",
  loader: "swal-small-loader",
};

type AlertOptions = {
  title?: string;
  text?: string;
  timer?: number;
};

type ConfirmOptions = {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
};

export const alerts = {
  // ⏳ Processando
  loading: (opts?: { title?: string; text?: string }) => {
    MySwal.fire({
      title: opts?.title ?? "Processando...",
      text: opts?.text ?? "Aguarde um momento",
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: compactSweetAlertClasses,
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
      customClass: compactSweetAlertClasses,
    });
  },

  // ⚠️ Warning
  warn: (opts?: AlertOptions) => {
    return MySwal.fire({
      icon: "warning",
      title: opts?.title ?? "Atenção",
      text: opts?.text ?? "Verifique as informações antes de continuar.",
      timer: opts?.timer ?? 1800,
      customClass: compactSweetAlertClasses,
    });
  },

  // ❌ Erro
  error: (opts?: AlertOptions) => {
    return MySwal.fire({
      icon: "error",
      title: opts?.title ?? "Atenção",
      text: opts?.text ?? "Ocorreu um erro. Tente novamente.",
      confirmButtonText: "Ok",
      customClass: compactSweetAlertClasses,
    });
  },

  confirm: async (opts: ConfirmOptions) => {
    const result = await MySwal.fire({
      icon: "question",
      title: opts.title,
      text: opts.text,
      showCancelButton: true,
      confirmButtonText: opts.confirmButtonText ?? "Confirmar",
      cancelButtonText: opts.cancelButtonText ?? "Cancelar",
      reverseButtons: true,
      customClass: compactSweetAlertClasses,
    });

    return result.isConfirmed;
  },
};
