import { Sector } from "./sector.model";

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string; // Senha é opcional, especialmente ao buscar/exibir
  sector?: Sector; // Relacionamento opcional, pode não vir em todas as buscas
  sectorId?: number; // ID pode ser útil para criação/atualização
}

