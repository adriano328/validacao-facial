export type Pessoa = {
  nome: string;
  dataNascimento: string;
  telefone: string;
  endereco: string;
  bairro: string;
  numero: string;
  complemento: string;
  municipioResidencia: string;
  municipioCongregacao: string;
  setorCongregacao: string;
  linkFoto: string;
  atividadeProfissional: string;
  cargoEclesiastico: string;
  email: string;
  senha: string;
  senhaConfirmacao: string;
};

export const initialCadastroForm: Pessoa = {
  nome: "",
  dataNascimento: "",
  telefone: "",
  endereco: "",
  bairro: "",
  numero: "",
  complemento: "",
  municipioResidencia: "",
  municipioCongregacao: "",
  setorCongregacao: "",
  linkFoto: "",
  atividadeProfissional: "",
  cargoEclesiastico: "",
  email: "",
  senha: "",
  senhaConfirmacao: "",
};