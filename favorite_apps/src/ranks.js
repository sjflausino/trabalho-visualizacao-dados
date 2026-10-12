// Calcula a posição (1 = mais votado) de cada app em cada pesquisa.
// Em caso de empate, quem estava na frente na pesquisa anterior continua na frente.
export function computeRanks(rows) {
  const dates = [...new Set(rows.map(r => +r.date))].sort((a, b) => a - b);
  const prevRank = new Map();
  const out = [];

  for (const t of dates) {
    const current = rows.filter(r => +r.date === t);
    const sorted = [...current].sort((a, b) =>
      b.value - a.value ||
      (prevRank.get(a.app) ?? 0) - (prevRank.get(b.app) ?? 0)
    );
    sorted.forEach((r, i) => {
      prevRank.set(r.app, i + 1);
      out.push({ ...r, rank: i + 1 });
    });
  }
  return out;
}
