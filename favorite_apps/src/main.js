// ============================================================
// main.js
// Ponto de entrada: carrega os dados (DuckDB) e desenha os dois gráficos (D3).
// ============================================================
import { loadData } from './data.js';
import { renderLineChart } from './lineChart.js';
import { renderBumpChart } from './bumpChart.js';

// Dados já validados e transformados pelo DuckDB
const { rows } = await loadData();

// Gráfico 1: evolução de cada app ao longo do tempo
renderLineChart('#chart-line', rows);

// Gráfico 2: posição (ranking) de cada app em cada pesquisa
renderBumpChart('#chart-bump', rows);
