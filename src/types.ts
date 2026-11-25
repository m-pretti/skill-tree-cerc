export type Status = 'todo' | 'doing' | 'done';

export interface Tag {
  id: string;
  nome: string;
  cor: string;
}

export interface Card {
  id: string;
  titulo: string;
  semana: number;
  eixoId: string;
  trilhaId: string;
  status: Status;
  nota?: string;
  /** Dia (AAAA-MM-DD, horário local) em que o card foi concluído. Usado na ofensiva e nas missões do dia. */
  concluidoEm?: string;
}

export interface AppState {
  version: 1;
  cards: Card[];
  eixos: Tag[];
  trilhas: Tag[];
}

export type TagKind = 'eixos' | 'trilhas';

export const STATUS_ORDER: Status[] = ['todo', 'doing', 'done'];

export const STATUS_LABEL: Record<Status, string> = {
  todo: 'A fazer',
  doing: 'Em curso',
  done: 'Concluído',
};

export function nextStatus(s: Status): Status {
  return STATUS_ORDER[(STATUS_ORDER.indexOf(s) + 1) % STATUS_ORDER.length];
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
