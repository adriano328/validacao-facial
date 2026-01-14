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
  nome: "asdasdadasds",
  dataNascimento: "26041995",
  telefone: "555555555",
  endereco: "adasd55sa5",
  bairro: "asdasdas",
  numero: "56",
  complemento: "asdasd",
  municipioResidencia: "",
  municipioCongregacao: "",
  setorCongregacao: "adasdsad",
  linkFoto: "",
  atividadeProfissional: "adsad",
  cargoEclesiastico: "as",
  email: "asdasd@gmail.com",
  senha: "12345678",
  senhaConfirmacao: "12345678",
};