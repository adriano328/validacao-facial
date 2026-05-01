import type { CargoUsuario } from "@features/registration/model/types";

export const CARGOS_ECLESIASTICOS: Array<{
  label: string;
  value: CargoUsuario;
}> = [
  { label: "Pastor", value: 'PASTOR' },
  { label: "Evangelista", value: 'EVANGELISTA' },
];
