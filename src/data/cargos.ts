import type { CargoUsuario } from "../features/cadastro/types";

export const CARGOS_ECLESIASTICOS: Array<{
  label: string;
  value: CargoUsuario;
}> = [
  { label: "Pastor", value: 1 },
  { label: "Evangelista", value: 2 },
];