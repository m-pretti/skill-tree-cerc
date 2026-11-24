import type { AppState, Card, Status } from './types';

type Eixo = 'infra' | 'stack' | 'estudo';
type Trilha = 'avalia' | 'geral';
type Row = [semana: number, titulo: string, eixo: Eixo, trilha: Trilha, status: Status, nota?: string];

const ROWS: Row[] = [
  // Semana 01
  [1, 'Deploy CI/CD', 'infra', 'avalia', 'done'],
  [1, 'Docker', 'stack', 'avalia', 'done'],
  [1, 'Kubernetes', 'stack', 'avalia', 'done'],
  [1, 'Mensageria', 'infra', 'avalia', 'done'],
  [1, 'FastAPI', 'stack', 'avalia', 'done'],
  [1, 'Google Cloud Pub/Sub', 'stack', 'avalia', 'done'],
  [1, 'Azure Devops', 'stack', 'avalia', 'done'],
  [1, 'SSH', 'stack', 'avalia', 'done'],
  [1, 'Arquitetura', 'infra', 'avalia', 'todo'],
  [1, 'Git Trunk', 'infra', 'avalia', 'done'],
  [1, 'Ambientes de Desenvolvimento', 'infra', 'avalia', 'done'],
  // Semana 02
  [2, 'Assessment Maestro', 'infra', 'avalia', 'done'],
  [2, 'Data Maestro', 'infra', 'avalia', 'done'],
  [2, 'Feature Engine', 'infra', 'avalia', 'done'],
  [2, 'Diferentes Feeders', 'infra', 'avalia', 'done'],
  [2, 'Tipos de Protocolo', 'estudo', 'geral', 'todo'],
  [2, 'Tipos de Banco', 'estudo', 'geral', 'todo', 'Transacional, Quente, Analítico, Postgress'],
  [2, 'Microserviço x Monolito', 'estudo', 'geral', 'todo'],
  [2, 'Proxy', 'infra', 'avalia', 'done'],
  [2, 'Parser', 'infra', 'avalia', 'done'],
  [2, 'Webhook', 'stack', 'avalia', 'done'],
  [2, 'RDM', 'infra', 'avalia', 'done'],
  // Semana 03
  [3, 'Cronjob', 'estudo', 'geral', 'done'],
  [3, 'Swagger', 'estudo', 'geral', 'done'],
  [3, 'Contrato de Dados', 'estudo', 'geral', 'done'],
  [3, 'Loadbalancer', 'estudo', 'geral', 'done'],
  [3, 'BigQuery vs DataBricks', 'stack', 'avalia', 'todo'],
  [3, 'Design Patterns', 'infra', 'avalia', 'done'],
  [3, 'DLQ', 'infra', 'avalia', 'done'],
  [3, 'Observabilidade', 'estudo', 'geral', 'done', 'New Relic'],
  [3, 'Feature Flag', 'infra', 'avalia', 'done'],
  [3, 'Singleton', 'infra', 'avalia', 'done'],
  [3, 'Porque usamos Proxy?', 'infra', 'avalia', 'done'],
  // Semana 04
  [4, 'Warehouse', 'estudo', 'geral', 'todo'],
  [4, 'DataLake', 'estudo', 'geral', 'todo'],
  [4, 'Workers', 'estudo', 'geral', 'done'],
  [4, 'Avalia Commons', 'infra', 'avalia', 'done'],
  [4, 'POCs Qualifica', 'infra', 'avalia', 'done'],
  [4, 'Interoperabilidade', 'estudo', 'geral', 'done'],
  [4, 'Duplicata Escritural', 'estudo', 'geral', 'todo'],
  [4, 'Query', 'estudo', 'geral', 'done'],
  [4, 'I/O', 'estudo', 'geral', 'done'],
  [4, 'Inferência', 'estudo', 'geral', 'done'],
  [4, 'Plug in Play', 'estudo', 'geral', 'done'],
  // Semana 05
  [5, 'Google Cloud Logs Explorer', 'stack', 'avalia', 'done'],
  [5, 'Trace ID', 'estudo', 'geral', 'done'],
  [5, 'Instâncias', 'estudo', 'geral', 'done'],
  [5, 'Aplicação', 'estudo', 'geral', 'done'],
  [5, 'Enum', 'infra', 'avalia', 'done'],
  [5, 'Fallback', 'estudo', 'geral', 'todo'],
  [5, 'Portfoward', 'estudo', 'geral', 'todo'],
  // Semana 06
  [6, 'UNICIDADE_V2', 'infra', 'avalia', 'done'],
  [6, 'ENABLE_MONITORING', 'infra', 'avalia', 'done'],
  [6, 'INTEROP_PLAC', 'infra', 'avalia', 'done'],
  [6, 'Resiliência', 'estudo', 'geral', 'todo'],
  [6, 'Circuit Breaker', 'estudo', 'geral', 'todo'],
  // Semana 07
  [7, 'IAC', 'estudo', 'geral', 'done'],
  [7, 'Buckets', 'estudo', 'geral', 'done'],
  // Semana 08
  [8, 'Plac Scriptural', 'infra', 'avalia', 'done'],
  [8, 'Sonar', 'infra', 'avalia', 'todo'],
  // Semana 09
  [9, 'ADR', 'infra', 'avalia', 'todo'],
];

export function createSeed(): AppState {
  const cards: Card[] = ROWS.map(([semana, titulo, eixoId, trilhaId, status, nota], i) => ({
    id: `seed-${i + 1}`,
    titulo,
    semana,
    eixoId,
    trilhaId,
    status,
    ...(nota ? { nota } : {}),
  }));

  return {
    version: 1,
    cards,
    eixos: [
      { id: 'infra', nome: 'Infra', cor: '#1F5FB8' },
      { id: 'stack', nome: 'Stack', cor: '#0A9CC4' },
      { id: 'estudo', nome: 'Estudo', cor: '#5B5FC7' },
    ],
    trilhas: [
      { id: 'avalia', nome: 'Avalia', cor: '#0B4F9C' },
      { id: 'geral', nome: 'Geral', cor: '#13908A' },
    ],
  };
}
