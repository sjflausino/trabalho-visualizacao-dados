import * as d3 from 'd3';
import { COLORS, BUMP_DIMENSIONS } from './config.js';

export function renderBumpChart(selector, data) {
  // Dimensões da área do gráfico
  const { width, height, margin } = BUMP_DIMENSIONS;
  const innerW = width  - margin.left - margin.right;
  const innerH = height - margin.top  - margin.bottom;

  //  Prepara os dados
  // Lista de pesquisas únicas: [[timestamp, "Spring 2015"], ...] em ordem cronológica
  const surveys = [...new Map(data.map(d => [+d.date, d.survey])).entries()]
    .sort((a, b) => a[0] - b[0]);

  // Uma série por app, em ordem cronológica
  const series = d3.groups(data, d => d.app)
    .map(([app, values]) => ({ app, values: values.sort((a, b) => a.date - b.date) }));

  // Cria o SVG (responsivo, via viewBox)
  const svg = d3.select(selector)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Escalas
  // X: uma posição fixa para cada pesquisa
  const x = d3.scalePoint()
    .domain(surveys.map(s => s[0]))
    .range([0, innerW]);

  // Y: posições do ranking (1 em cima, último embaixo)
  const nRanks = d3.max(data, d => d.rank);
  const y = d3.scalePoint()
    .domain(d3.range(1, nRanks + 1))
    .range([0, innerH]);

  // Cor de cada app (cinza se não estiver no config)
  const color = app => COLORS[app] ?? '#888';

  // Nome de cada pesquisa no topo
  g.selectAll('.survey-label')
    .data(surveys)
    .join('text')
    .attr('x', s => x(s[0]))
    .attr('y', -22)
    .attr('text-anchor', 'middle')
    .attr('fill', '#666')
    .attr('font-size', '.8rem')
    .text(s => s[1]);

  // Linhas
  // Curva "bump": sai e chega na horizontal em cada ponto
  const line = d3.line()
    .x(d => x(+d.date))
    .y(d => y(d.rank))
    .curve(d3.curveBumpX);

  // Um grupo <g> por app
  const groups = g.selectAll('.serie')
    .data(series)
    .join('g')
    .attr('class', 'serie');

  groups.append('path')
    .attr('fill', 'none')
    .attr('stroke', d => color(d.app))
    .attr('stroke-width', 5)
    .attr('stroke-linecap', 'round')
    .attr('d', d => line(d.values));

  // Círculos
  groups.selectAll('circle')
    .data(d => d.values)
    .join('circle')
    .attr('cx', d => x(+d.date))
    .attr('cy', d => y(d.rank))
    .attr('r', 16)
    .attr('fill', d => color(d.app))
    .attr('stroke', '#fafafa')
    .attr('stroke-width', 2);

  // % dentro de cada círculo
 groups.selectAll('.value')
    .data(d => d.values)
    .join('text')
    .attr('class', 'value')
    .attr('x', d => x(+d.date))
    .attr('y', d => y(d.rank))
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('fill', '#fff')  
    .attr('font-size', '.75rem')
    .attr('font-weight', 700)
    .text(d => d.value);

  // Nome do app nas duas pontas
  // À esquerda: posição inicial do app
  groups.append('text')
    .attr('x', -26)
    .attr('y', d => y(d.values[0].rank))
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'central')
    .attr('fill', d => color(d.app))
    .attr('font-weight', 700)
    .text(d => d.app);

  // À direita: posição final do app
  groups.append('text')
    .attr('x', innerW + 26)
    .attr('y', d => y(d.values.at(-1).rank))
    .attr('dominant-baseline', 'central')
    .attr('fill', d => color(d.app))
    .attr('font-weight', 700)
    .text(d => d.app);
}
