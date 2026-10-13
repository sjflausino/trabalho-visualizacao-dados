import * as d3 from 'd3';
const COLORS = {
  Instagram: '#8338ec',
  Snapchat:  '#e63946',
  Facebook:  '#002841',
  Twitter:   '#73bbeb',
};

/**
 * GRÁFICO 1: LINHAS
 */
export function renderLineChart(data, selector) {
  const svg = d3.select(selector);
  const width = +svg.style("width").split("px")[0] || 860;
  const height = +svg.style("height").split("px")[0] || 440;
  const margin = { top: 30, right: 130, bottom: 50, left: 60 };
  
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  svg.selectAll("*").remove(); 

  const series = d3.groups(data, d => d.app)
    .map(([app, values]) => ({ app, values: values.sort((a, b) => a.date - b.date) }));

  const surveyDates = [...new Set(data.map(d => +d.date))].sort((a, b) => a - b).map(t => new Date(t));

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime()
    .domain([d3.timeMonth.offset(d3.min(data, d => d.date), -1), d3.timeMonth.offset(d3.max(data, d => d.date), +1)])
    .range([0, innerW]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value) * 1.1]).nice()
    .range([innerH, 0]);

  const color = app => COLORS[app] ?? '#888';

  g.append('g').attr('class', 'grid').call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(''));
  g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x).tickValues(surveyDates).tickFormat(d3.timeFormat('%b %Y')));
  g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'));

  const line = d3.line().x(d => x(d.date)).y(d => y(d.value)).curve(d3.curveMonotoneX);

  const groups = g.selectAll('.serie').data(series).join('g').attr('class', 'serie');

  groups.append('path')
    .attr('fill', 'none')
    .attr('stroke', d => color(d.app))
    .attr('stroke-width', 3)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('d', d => line(d.values));

  const MIN_GAP = 16;
  const labels = series.map(s => ({ app: s.app, value: s.values.at(-1).value, y: y(s.values.at(-1).value) }));
  labels.sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) {
    if (labels[i].y - labels[i - 1].y < MIN_GAP) labels[i].y = labels[i - 1].y + MIN_GAP;
  }

  g.selectAll('.end-label').data(labels).join('text')
    .attr('class', 'end-label')
    .attr('x', innerW + 10)
    .attr('y', d => d.y)
    .attr('dominant-baseline', 'middle')
    .attr('fill', d => color(d.app))
    .attr('font-size', '.85rem')
    .attr('font-weight', 700)
    .text(d => `${d.app} ${d.value}%`);
}

/**
 * GRÁFICO 2: BUMP CHART (RANKING)
 */
export function renderBumpChart(data, selector) {
  const svg = d3.select(selector);
  const width = +svg.style("width").split("px")[0] || 860;
  const height = +svg.style("height").split("px")[0] || 440;
  const margin = { top: 50, right: 120, bottom: 40, left: 120 };

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  svg.selectAll("*").remove(); // Limpa a tela

  const surveys = [...new Map(data.map(d => [+d.date, d.survey])).entries()].sort((a, b) => a[0] - b[0]);
  const series = d3.groups(data, d => d.app)
    .map(([app, values]) => ({ app, values: values.sort((a, b) => a.date - b.date) }));

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scalePoint().domain(surveys.map(s => s[0])).range([0, innerW]);
  const nRanks = d3.max(data, d => Number(d.rank));
  const y = d3.scalePoint().domain(d3.range(1, nRanks + 1)).range([0, innerH]);

  const color = app => COLORS[app] ?? '#888';

  g.selectAll('.survey-label').data(surveys).join('text')
    .attr('x', s => x(s[0]))
    .attr('y', -20)
    .attr('text-anchor', 'middle')
    .attr('fill', '#666')
    .attr('font-size', '.8rem')
    .text(s => s[1]);

  const line = d3.line().x(d => x(+d.date)).y(d => y(d.rank)).curve(d3.curveBumpX);

  const groups = g.selectAll('.serie').data(series).join('g').attr('class', 'serie');

  groups.append('path')
    .attr('fill', 'none')
    .attr('stroke', d => color(d.app))
    .attr('stroke-width', 3)
    .attr('stroke-linecap', 'round')
    .attr('d', d => line(d.values));

  groups.selectAll('circle').data(d => d.values).join('circle')
    .attr('cx', d => x(+d.date))
    .attr('cy', d => y(d.rank))
    .attr('r', 16)
    .attr('fill', d => color(d.app))
    .attr('stroke', '#fafafa')
    .attr('stroke-width', 2);

 groups.selectAll('.value').data(d => d.values).join('text')
    .attr('class', 'value')
    .attr('x', d => x(+d.date))
    .attr('y', d => y(d.rank))
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('fill', '#fff')  
    .attr('font-size', '.75rem')
    .attr('font-weight', 700)
    .text(d => d.value);

  groups.append('text')
    .attr('x', -26)
    .attr('y', d => y(d.values[0].rank))
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'central')
    .attr('fill', d => color(d.app))
    .attr('font-weight', 700)
    .text(d => d.app);

  groups.append('text')
    .attr('x', innerW + 26)
    .attr('y', d => y(d.values.at(-1).rank))
    .attr('dominant-baseline', 'central')
    .attr('fill', d => color(d.app))
    .attr('font-weight', 700)
    .text(d => d.app);
}