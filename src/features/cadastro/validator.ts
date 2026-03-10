import { isValidCPF } from "../../utils/cpfValidator";
import type { CadastroForm } from "./types";

export type CadastroErrors = Partial<Record<keyof CadastroForm, string>>;

const isEmpty = (v: unknown) =>
  v === undefined ||
  v === null ||
  (typeof v === "string" && v.trim().length === 0);

const onlyDigits = (v: string) => v.replace(/\D/g, "");

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDateBR(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;

  const [dd, mm, yyyy] = value.split("/").map(Number);
  if (!dd || !mm || !yyyy) return false;

  const d = new Date(yyyy, mm - 1, dd);

  return (
    d.getFullYear() === yyyy &&
    d.getMonth() === mm - 1 &&
    d.getDate() === dd
  );
}

export function validateCadastro(data: CadastroForm): CadastroErrors {
  const errors: CadastroErrors = {};

  if (isEmpty(data.nome)) {
    errors.nome = "Campo obrigatório";
  }

  if (isEmpty(data.cpf)) {
    errors.cpf = "Campo obrigatório";
  } else if (!isValidCPF(data.cpf)) {
    errors.cpf = "CPF inválido";
  }

  if (isEmpty(data.telefone)) {
    errors.telefone = "Campo obrigatório";
  } else if (onlyDigits(data.telefone).length < 10) {
    errors.telefone = "Telefone inválido";
  }

  if (isEmpty(data.dataNascimento)) {
    errors.dataNascimento = "Campo obrigatório";
  } else if (!isValidDateBR(data.dataNascimento)) {
    errors.dataNascimento = "Data inválida";
  }

  if (isEmpty(data.email)) {
    errors.email = "Campo obrigatório";
  } else if (!isValidEmail(data.email)) {
    errors.email = "E-mail inválido";
  }

  if (isEmpty(data.senha)) {
    errors.senha = "Campo obrigatório";
  } else if (data.senha.length < 6) {
    errors.senha = "Mínimo 6 caracteres";
  }

   if (isEmpty(data.senhaConfirmacao)) {
    errors.senhaConfirmacao = "Campo obrigatório";
  } else if (data.senhaConfirmacao !== data.senha) {
    errors.senhaConfirmacao = "As senhas não conferem";
  }

  if (data.cargo === undefined) {
    errors.cargo = "Campo obrigatório";
  }

  if (data.campoEclesiasticoId === undefined) {
    errors.campoEclesiasticoId = "Campo obrigatório";
  }

  if (isEmpty(data.documento)) {
    errors.documento = "Campo obrigatório";
  }

  return errors;
}

export function validateField<K extends keyof CadastroForm>(
  data: CadastroForm,
  key: K
): string | undefined {
  const all = validateCadastro(data);
  return all[key];
}

export function hasErrors(errors: CadastroErrors) {
  return Object.keys(errors).length > 0;
}