import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { AppState, TagKind } from '../types';
import type { Actions } from '../store';
import { Modal } from './common';

const PALETTE = ['#0B4F9C', '#1F5FB8', '#0A9CC4', '#13908A', '#5B5FC7', '#C2410C', '#B4235A', '#5F6B7A'];

function Section({ kind, title, state, actions }: { kind: TagKind; title: string; state: AppState; actions: Actions }) {
  const [nome, setNome] = useState('');
  const tags = state[kind];
  const field = kind === 'eixos' ? 'eixoId' : 'trilhaId';

  const add = () => {
    const n = nome.trim();
    if (!n) return;
    actions.addTag(kind, n, PALETTE[tags.length % PALETTE.length]);
    setNome('');
  };

  return (
    <section className="tax-section">
      <h3>{title}</h3>
      <ul className="tax-list">
        {tags.map((t) => {
          const count = state.cards.filter((c) => c[field] === t.id).length;
          return (
            <li key={t.id}>
              <input
                type="color"
                value={t.cor}
                onChange={(e) => actions.updateTag(kind, t.id, { cor: e.target.value })}
                aria-label={`Cor de ${t.nome}`}
              />
              <input
                className="tax-name"
                value={t.nome}
                onChange={(e) => actions.updateTag(kind, t.id, { nome: e.target.value })}
                aria-label={`Nome de ${t.nome}`}
              />
              <span className="tax-count">
                {count} card{count === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                className="icon-btn"
                disabled={count > 0}
                title={count > 0 ? 'Em uso — mova os cards antes de excluir' : 'Excluir'}
                onClick={() => actions.deleteTag(kind, t.id)}
                aria-label={`Excluir ${t.nome}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          );
        })}
      </ul>
      <form
        className="tax-add"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder={`Novo ${kind === 'eixos' ? 'eixo' : 'trilha'}…`} />
        <button type="submit" className="outline-btn" disabled={!nome.trim()}>
          <Plus size={16} /> Adicionar
        </button>
      </form>
    </section>
  );
}

export function TaxonomyModal({ state, actions, onClose }: { state: AppState; actions: Actions; onClose: () => void }) {
  return (
    <Modal title="Trilhas e eixos" onClose={onClose} wide>
      <div className="tax-grid">
        <Section kind="eixos" title="Eixos" state={state} actions={actions} />
        <Section kind="trilhas" title="Trilhas" state={state} actions={actions} />
      </div>
      <div className="tax-danger">
        <span>Restaurar os 61 cards originais (apaga suas alterações).</span>
        <button
          type="button"
          className="danger-btn"
          onClick={() => {
            if (confirm('Restaurar os dados iniciais? Todas as alterações serão perdidas.')) actions.restoreSeed();
          }}
        >
          Restaurar dados iniciais
        </button>
      </div>
    </Modal>
  );
}
