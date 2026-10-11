import * as d3 from 'd3';

export async function loadChart(data, margens = { left: 80, right: 120, top: 40, bottom: 60 }) {
    const svg = d3.select('svg');

    if (!svg) {
        return;
    }

    // Pega largura e altura configurados no index.css
    const width = +svg.style("width").split("px")[0];
    const height = +svg.style("height").split("px")[0];

    clearChart();

    // 1. CORREÇÃO: Conversão explícita de BigInt para Number e conversão da Data
    const parsedData = data.map(d => ({
        ...d,
        release_date: new Date(d.release_date),
        // O DuckDB retorna BigInt, o D3 precisa de Number. 
        perf: Number(d.perf) 
    }));

    // ---- Escalas
    // Eixo X: Tempo (d3.scaleTime)
    const dateExtent = d3.extent(parsedData, d => d.release_date);
    const mapX = d3.scaleTime()
        .domain(dateExtent)
        .range([0, width - margens.left - margens.right]);

    // Eixo Y: Escala Logarítmica (d3.scaleLog)
    const perfExtent = d3.extent(parsedData, d => d.perf);
    const mapY = d3.scaleLog()
        // Adicionamos margem de 10% nas bordas multiplicando/dividindo por 1.5 e 0.5
        .domain([perfExtent[0] * 0.5, perfExtent[1] * 1.5]) 
        .range([height - margens.bottom - margens.top, 0]);

    // Escala de Cor: Categórica (d3.scaleOrdinal)
    const manufacturers = [...new Set(parsedData.map(d => d.manufacturer))];
    const mapColor = d3.scaleOrdinal()
        .domain(manufacturers)
        .range(["#ff4b4b", "#00d26a", "#555555"]); // Vermelho AMD, Verde NVIDIA, Cinza Huawei

    // ---- Eixos
    const xAxis  = d3.axisBottom(mapX).ticks(6);
    const groupX = svg.selectAll('#axisX').data([0]);

    groupX.join('g')
        .attr('id', 'axisX')
        .attr('class', 'x axis')
        .attr('transform', `translate(${margens.left}, ${height - margens.bottom})`)
        .call(xAxis);

    // Formatação do Eixo Y: 
    // Como é uma escala logarítmica, nós filtramos os "ticks" para não ficarem amontoados
    // e formatamos os números para K (mil), M (milhão), G (bilhão)
    const yAxis = d3.axisLeft(mapY)
        .ticks(10, "~s"); // ~s usa as abreviações do sistema internacional (SI)

    const groupY = svg.selectAll('#axisY').data([0]);

    groupY.join('g')
        .attr('id', 'axisY')
        .attr('class', 'y axis')
        .attr('transform', `translate(${margens.left}, ${margens.top})`)
        .call(yAxis);

    // ---- Rótulo do Eixo Y
    svg.selectAll('.y-label').data([0]).join('text')
        .attr('class', 'y-label')
        .attr("transform", "rotate(-90)")
        .attr("y", margens.left / 3)
        .attr("x", -((height - margens.bottom) / 2)) // Centralizado no eixo Y
        .style("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-size", "14px")
        .text("FLOP/s/$ (Escala Logarítmica)");

    // ---- Círculos
    const selection = svg.selectAll('#group').data([0]);
    const cGroup = selection.join('g')
            .attr('id', 'group')
            .attr('transform', `translate(${margens.left}, ${margens.top})`);

    const circles = cGroup.selectAll('circle')
        .data(parsedData);

    const circlesEnter = circles.enter()
        .append('circle');

    circles.exit().remove();

    circlesEnter.merge(circles)
        .attr('cx', d => mapX(d.release_date))
        .attr('cy', d => mapY(d.perf))
        .attr('r', 6)
        .style('fill', d => mapColor(d.manufacturer))
        .style('stroke', '#333')
        .style('stroke-width', '0.5')
        .style('opacity', 0.8)
        .append('title') // Tooltip interativo nativo
        .text(d => `${d.entity}\nFabricante: ${d.manufacturer}\nData: ${d.release_date.toLocaleDateString()}\nPerformance: ${d3.format(",")(d.perf)} FLOP/s/$`);

    // ---- Legenda
    const legendGroup = svg.selectAll('#legend').data([0]).join('g')
        .attr('id', 'legend')
        .attr('transform', `translate(${width - margens.right + 20}, ${margens.top})`);

    const legendItems = legendGroup.selectAll('.legend-item').data(manufacturers);
    
    const legendEnter = legendItems.enter().append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`);
        
    legendEnter.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', d => mapColor(d));
        
    legendEnter.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')
        .text(d => d);
}

export function clearChart() {
    d3.select('#group').selectAll('circle').remove();
    d3.select('#axisX').selectAll('*').remove();
    d3.select('#axisY').selectAll('*').remove();
    d3.select('.y-label').remove();
    d3.select('#legend').selectAll('*').remove();
}