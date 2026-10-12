// ============================================================
// config.js
// Configurações compartilhadas pelos gráficos: cores e dimensões.
// ============================================================

// Cor de cada rede social (usada nos dois gráficos)
export const COLORS = {
  Instagram: '#8338ec',
  Snapchat:  '#e63946',
  Facebook:  '#002841',
  Twitter:   '#73bbeb',
};

// Dimensões do gráfico de linhas (em unidades do viewBox do SVG)
export const LINE_DIMENSIONS = {
  width: 860,
  height: 440,
  margin: { top: 30, right: 130, bottom: 50, left: 60 }, // right maior p/ os rótulos no fim das linhas
};

// Dimensões do gráfico de ranking (bump chart)
export const BUMP_DIMENSIONS = {
  width: 860,
  height: 340,
  margin: { top: 30, right: 120, bottom: 40, left: 120 }, // left/right guardam os nomes dos apps
};
