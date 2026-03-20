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
  campoEclesiastico: CampoEclesiasticoPayload;
  documento: string;
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
  campoEclesiasticoId: number | undefined;
  documento: string;
};

export const initialCadastroForm: CadastroForm = {
  nome: "Lucas Adriano Dias Ramos",
  cargo: undefined,
  telefone: "65999011697",
  dataNascimento: "26/04/1995",
  email: "lucasadrianodias@gmail.com",
  senha: "130665",
  senhaConfirmacao: "130665",
  cpf: "04814617100",
  campoEclesiasticoId: undefined,
  documento: "",
};