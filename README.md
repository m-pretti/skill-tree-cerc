# skill-tree-cerc

Skill tree dos meus estudos na CERC: cards organizados por semana, com eixos (Infra, Stack, Estudo),
trilhas (Avalia, Geral), status e um sistema de levels.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
```

## Deploy

Cada push na `main` publica no GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml):
https://m-pretti.github.io/skill-tree-cerc/

Os dados ficam no navegador de cada endereço: use Exportar (localhost) → Importar (Pages) para levar o progresso.

## Como funciona

- **Árvore / Lista**: duas visões dos mesmos cards. Na árvore, cada coluna é uma semana.
- **Status**: clique no ícone do card (ou Espaço com o card focado) para avançar
  A fazer → Em curso → Concluído. Clique no card para editar título, semana, eixo, trilha e nota.
- **Anotação obrigatória**: para marcar um card como concluído é preciso escrever uma anotação.
  Se tentar concluir sem nota, o card abre pedindo a anotação.
- **Arrastar e soltar**: arraste cards entre semanas (ou para a coluna "Nova semana").
- **Filtros**: eixo, trilha, busca por texto, e a legenda de status funciona como filtro.
- **Levels**: o Level 1 exige 3 cards; cada level seguinte exige um card a mais (ver `src/level.ts`).
- **Dados**: salvos no `localStorage` do navegador. Use **Exportar/Importar** para backup em JSON
  ou para levar os dados para outro navegador. Os dados iniciais ficam em `src/seed.ts`.
