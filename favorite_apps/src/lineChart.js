// ============================================================
// lineChart.js
// Gráfico de linhas (D3): uma linha por rede social,
// mostrando o % de teens que a consideram favorita em cada pesquisa.
// ============================================================
import * as d3 from 'd3';
import { COLORS, LINE_DIMENSIONS } from './config.js';

export function renderLineChart(selector, data) {
  // ---------- Dimensões da área do gráfico ----------
  const { width, height, margin } = LINE_DIMENSIONS;
  const innerW = width  - margin.left - margin.right;
  const innerH = height - margin.top  - margin.bottom;

  // ---------- Prepara os dados ----------
  // Uma série por app, com os pontos em ordem cronológica
  const series = d3.groups(data, d => d.app)
    .map(([app, values]) => ({ app, values: values.sort((a, b) => a.date - b.date) }));

  // Datas únicas das pesquisas (viram os marcadores do eixo X)
  const surveyDates = [...new Set(data.map(d => +d.date))]
    .sort((a, b) => a - b)
    .map(t => new Date(t));

  // ---------- Cria o SVG (responsivo, via viewBox) ----------
  const svg = d3.select(selector)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  // Grupo deslocado pelas margens
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // ---------- Escalas ----------
  // X: tempo (com 1 mês de folga em cada ponta)
  const x = d3.scaleTime()
    .domain([
      d3.timeMonth.offset(d3.min(data, d => d.date), -1),
      d3.timeMonth.offset(d3.max(data, d => d.date), +1),
    ])
    .range([0, innerW]);

  // Y: percentual de 0 até um pouco acima do maior valor
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value) * 1.1])
    .nice()
    .range([innerH, 0]);

  // Cor de cada app (cinza se não estiver no config)
  const color = app => COLORS[app] ?? '#888';

  // ---------- Grid e eixos ----------
  // Linhas de grade horizontais (eixo Y sem texto, só com traços longos)
  g.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(''));

  // Eixo X: uma marca por pesquisa (ex.: "Mar 2015")
  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickValues(surveyDates).tickFormat(d3.timeFormat('%b %Y')));

  // Eixo Y: valores em %
  g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'));

  // ---------- Linhas ----------
  // Gerador de linha: curva suave que respeita os dados (sem "ondas" falsas)
  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX);

  // Um grupo <g> por app
  const groups = g.selectAll('.serie')
    .data(series)
    .join('g')
    .attr('class', 'serie');

  // Desenha a linha de cada app
  groups.append('path')
    .attr('fill', 'none')
    .attr('stroke', d => color(d.app))
    .attr('stroke-width', 3)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('d', d => line(d.values));

  // ---------- Rótulos no fim das linhas ----------
  // Evita que nomes de linhas que terminam muito próximas (ex.: Facebook e Twitter)
  // fiquem sobrepostos, empurrando para baixo quem estiver a menos de MIN_GAP px.
  const MIN_GAP = 16;
  const labels = series.map(s => ({
    app: s.app,
    value: s.values.at(-1).value,       // último valor da série
    y: y(s.values.at(-1).value),        // posição vertical na tela
  }));
  labels.sort((a, b) => a.y - b.y);     // de cima para baixo
  for (let i = 1; i < labels.length; i++) {
    if (labels[i].y - labels[i - 1].y < MIN_GAP) {
      labels[i].y = labels[i - 1].y + MIN_GAP;
    }
  }

  // Escreve "App XX%" à direita da última pesquisa
  g.selectAll('.end-label')
    .data(labels)
    .join('text')
    .attr('class', 'end-label')
    .attr('x', innerW + 10)
    .attr('y', d => d.y)
    .attr('dominant-baseline', 'middle')
    .attr('fill', d => color(d.app))
    .attr('font-size', '.85rem')
    .attr('font-weight', 700)
    .text(d => `${d.app} ${d.value}%`);
}
