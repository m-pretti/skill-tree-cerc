import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { useSkillTree, isValidState, hasNote } from './store';
import { computeLevel } from './level';
import type { Card, Status } from './types';
import { pad2 } from './types';
import { BackupActions, ProgressPanel } from './components/ProgressPanel';
import { PathView } from './components/PathView';
import { Confetti } from './components/Confetti';
import { Toolbar, type View } from './components/Toolbar';
import { TreeView } from './components/TreeView';
import { ListView } from './components/ListView';
import { CardModal } from './components/CardModal';
import { TaxonomyModal } from './components/TaxonomyModal';

type Editing = { mode: 'new'; semana: number } | { mode: 'edit'; card: Card; completing?: boolean } | null;

const VIEW_KEY = 'cerc-skill-tree:view';

function readView(): View {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === 'list' || v === 'tree' ? v : 'path';
  } catch {
    return 'path';
  }
}

export default function App() {
  const [state, actions] = useSkillTree();
  const [view, setView] = useState<View>(readView);
  const [eixo, setEixo] = useState('all');
  const [trilha, setTrilha] = useState('all');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [taxOpen, setTaxOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; kind: 'info' | 'level' | 'week' } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      /* ignora */
    }
  }, [view]);

  const eixoMap = useMemo(() => new Map(state.eixos.map((t) => [t.id, t])), [state.eixos]);
  const trilhaMap = useMemo(() => new Map(state.trilhas.map((t) => [t.id, t])), [state.trilhas]);

  const weeks = useMemo(() => {
    const max = state.cards.reduce((m, c) => Math.max(m, c.semana), 1);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [state.cards]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.cards.filter(
      (c) =>
        (eixo === 'all' || c.eixoId === eixo) &&
        (trilha === 'all' || c.trilhaId === trilha) &&
        (!statusFilter || c.status === statusFilter) &&
        (!q || c.titulo.toLowerCase().includes(q) || c.nota?.toLowerCase().includes(q)),
    );
  }, [state.cards, eixo, trilha, statusFilter, query]);

  // Comemora level up e semanas fechadas (troféu)
  const done = state.cards.filter((c) => c.status === 'done').length;
  const { level } = computeLevel(done);
  const completeWeeks = useMemo(
    () =>
      weeks.filter((w) => {
        const all = state.cards.filter((c) => c.semana === w);
        return all.length > 0 && all.every((c) => c.status === 'done');
      }),
    [weeks, state.cards],
  );
  const prevLevel = useRef(level);
  const prevComplete = useRef(new Set(completeWeeks));
  const skipCelebration = useRef(false);
  useEffect(() => {
    const fresh = completeWeeks.find((w) => !prevComplete.current.has(w));
    if (skipCelebration.current) skipCelebration.current = false; // não comemora import
    else if (level > prevLevel.current) setToast({ text: `Level up! Você chegou ao Level ${level}`, kind: 'level' });
    else if (fresh !== undefined) setToast({ text: `Troféu! Semana ${pad2(fresh)} concluída`, kind: 'week' });
    prevLevel.current = level;
    prevComplete.current = new Set(completeWeeks);
  }, [level, completeWeeks]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill-tree-cerc-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!isValidState(parsed)) throw new Error('formato inválido');
      if (confirm(`Importar ${parsed.cards.length} cards? Isso substitui os dados atuais.`)) {
        skipCelebration.current = true;
        actions.replaceState(parsed);
        setToast({ text: 'Backup importado', kind: 'info' });
      }
    } catch {
      alert('Não foi possível ler esse arquivo. Use um JSON exportado pela própria Skill Tree.');
    }
  };

  const lastWeek = weeks[weeks.length - 1];

  // Concluir sem anotação abre o card pedindo a nota.
  const changeStatus = (card: Card, status: Status) => {
    if (status === 'done' && !hasNote(card)) setEditing({ mode: 'edit', card, completing: true });
    else actions.setStatus(card.id, status);
  };

  const backupProps = {
    onExport: exportJson,
    onImport: importJson,
    onReset: () => {
      if (confirm('Zerar progresso? Todos os cards voltam para "A fazer".')) actions.resetProgress();
    },
  };

  return (
    <div className={`app ${view === 'path' ? 'app-path' : ''}`}>
      {view !== 'path' && <ProgressPanel cards={state.cards} {...backupProps} />}

      <Toolbar
        view={view}
        onView={setView}
        eixos={state.eixos}
        trilhas={state.trilhas}
        eixo={eixo}
        trilha={trilha}
        onEixo={setEixo}
        onTrilha={setTrilha}
        query={query}
        onQuery={setQuery}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        onNewCard={() => setEditing({ mode: 'new', semana: lastWeek })}
        onTaxonomy={() => setTaxOpen(true)}
      />

      {view === 'path' ? (
        <PathView
          weeks={weeks}
          cards={filtered}
          allCards={state.cards}
          eixos={state.eixos}
          eixoMap={eixoMap}
          trilhaMap={trilhaMap}
          onOpen={(card) => setEditing({ mode: 'edit', card })}
          onNew={(semana) => setEditing({ mode: 'new', semana })}
          onStatus={changeStatus}
          backup={<BackupActions {...backupProps} />}
        />
      ) : view === 'tree' ? (
        <TreeView
          weeks={weeks}
          cards={filtered}
          allCards={state.cards}
          eixoMap={eixoMap}
          trilhaMap={trilhaMap}
          actions={actions}
          onOpen={(card) => setEditing({ mode: 'edit', card })}
          onNew={(semana) => setEditing({ mode: 'new', semana })}
          onStatus={changeStatus}
        />
      ) : (
        <ListView
          weeks={weeks}
          cards={filtered}
          eixoMap={eixoMap}
          trilhaMap={trilhaMap}
          actions={actions}
          onOpen={(card) => setEditing({ mode: 'edit', card })}
          onStatus={changeStatus}
        />
      )}

      {editing && (
        <CardModal
          key={editing.mode === 'edit' ? editing.card.id : 'new'}
          card={editing.mode === 'edit' ? editing.card : undefined}
          initialStatus={editing.mode === 'edit' && editing.completing ? 'done' : undefined}
          defaultSemana={editing.mode === 'new' ? editing.semana : editing.card.semana}
          eixos={state.eixos}
          trilhas={state.trilhas}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            if (editing.mode === 'edit') actions.updateCard(editing.card.id, draft);
            else actions.addCard(draft);
            setEditing(null);
          }}
          onDelete={
            editing.mode === 'edit'
              ? () => {
                  actions.deleteCard(editing.card.id);
                  setEditing(null);
                }
              : undefined
          }
        />
      )}

      {taxOpen && <TaxonomyModal state={state} actions={actions} onClose={() => setTaxOpen(false)} />}

      {toast?.kind === 'level' && <Confetti />}
      {toast && (
        <div className={`toast toast-${toast.kind}`} role="status">
          {toast.kind === 'week' ? <Trophy size={18} /> : <Sparkles size={18} />} {toast.text}
        </div>
      )}
    </div>
  );
}
