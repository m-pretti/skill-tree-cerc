import { GitFork, List, Plus, Search, SlidersHorizontal } from 'lucide-react';
import type { Status, Tag } from '../types';
import { STATUS_LABEL, STATUS_ORDER } from '../types';

export type View = 'tree' | 'list';

interface Props {
  view: View;
  onView: (v: View) => void;
  eixos: Tag[];
  trilhas: Tag[];
  eixo: string;
  trilha: string;
  onEixo: (v: string) => void;
  onTrilha: (v: string) => void;
  query: string;
  onQuery: (v: string) => void;
  statusFilter: Status | null;
  onStatusFilter: (s: Status | null) => void;
  onNewCard: () => void;
  onTaxonomy: () => void;
}

export function Toolbar(p: Props) {
  return (
    <div className="toolbar">
      <div className="segmented" role="tablist" aria-label="Visualização">
        <button type="button" role="tab" aria-selected={p.view === 'tree'} className={p.view === 'tree' ? 'on' : ''} onClick={() => p.onView('tree')}>
          <GitFork size={15} /> Árvore
        </button>
        <button type="button" role="tab" aria-selected={p.view === 'list'} className={p.view === 'list' ? 'on' : ''} onClick={() => p.onView('list')}>
          <List size={15} /> Lista
        </button>
      </div>

      <select className="select" value={p.eixo} onChange={(e) => p.onEixo(e.target.value)} aria-label="Filtrar por eixo">
        <option value="all">Todos os eixos</option>
        {p.eixos.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
          </option>
        ))}
      </select>

      <select className="select" value={p.trilha} onChange={(e) => p.onTrilha(e.target.value)} aria-label="Filtrar por trilha">
        <option value="all">Todas as trilhas</option>
        {p.trilhas.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
          </option>
        ))}
      </select>

      <label className="search">
        <Search size={16} />
        <input value={p.query} onChange={(e) => p.onQuery(e.target.value)} placeholder="Buscar card…" aria-label="Buscar card" />
      </label>

      <button type="button" className="primary-btn" onClick={p.onNewCard}>
        <Plus size={16} /> Novo card
      </button>
      <button type="button" className="outline-btn" onClick={p.onTaxonomy}>
        <SlidersHorizontal size={15} /> Trilhas e eixos
      </button>

      <div className="legend" aria-label="Filtrar por status">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            className={`legend-item st-${s} ${p.statusFilter === s ? 'on' : ''} ${p.statusFilter && p.statusFilter !== s ? 'dim' : ''}`}
            onClick={() => p.onStatusFilter(p.statusFilter === s ? null : s)}
            aria-pressed={p.statusFilter === s}
            title={p.statusFilter === s ? 'Mostrar todos' : `Mostrar só "${STATUS_LABEL[s]}"`}
          >
            <i /> {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
    </div>
  );
}
