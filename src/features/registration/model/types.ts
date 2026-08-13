export type CargoUsuario = "PASTOR" | "EVANGELISTA";

export type CampoEclesiasticoPayload = {
  id: number;
};

export type PessoaPayload = {
  nome: string;
  cargo: CargoUsuario;
  telefone: string;
  dataNascimento: string;
  email: string;
  senha: string;
  cpf: string;
  tipoUsuario: number;
  campoEclesiastico: CampoEclesiasticoPayload;
  foto: string;
  fotoDocumento: string;
};

  export type CadastroForm = {
    nome: string;
    cargo: CargoUsuario | undefined;
    telefone: string;
    dataNascimento: string;
    email: string;
    senha: string;
    senhaConfirmacao: string;
    cpf: string;
    tipoUsuario: number;
    campoEclesiasticoId: number | undefined;
    foto: string;
    fotoDocumento: string;
  };

export const initialCadastroForm: CadastroForm = {
  nome: "",
  cargo: undefined,
  telefone: "",
  dataNascimento: "",
  email: "",
  senha: "",
  senhaConfirmacao: "",
  cpf: "",
  tipoUsuario: 1,
  campoEclesiasticoId: undefined,
  foto: "",
  fotoDocumento: "",
};
