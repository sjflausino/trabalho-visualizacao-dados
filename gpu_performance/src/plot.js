import * as d3 from 'd3';

const margins = { left: 160, right: 30, top: 40, bottom: 60 };

/**
 * GRÁFICO ORIGINAL
 * Reproduz o visual exato da imagem de referência (Our World in Data),
 * demonstrando o problema da escala linear para crescimento tecnológico.
 */
export function renderOriginal(data, selector) {
    const svg = d3.select(selector);
    const width = +svg.style("width").split("px")[0];
    const height = +svg.style("height").split("px")[0];

    svg.selectAll("*").remove();

    const parsedData = data.map(d => ({
        ...d,
        release_date: new Date(d.release_date),
        perf: Number(d.perf)
    }));

    const marginsOrig = { left: 80, right: 140, top: 60, bottom: 40 };

    const minDate = new Date(2007, 6, 1);
    const maxDate = new Date(2023, 6, 1);

    const mapX = d3.scaleTime()
        .domain([minDate, maxDate])
        .range([marginsOrig.left, width - marginsOrig.right]);

    const mapY = d3.scaleLinear()
        .domain([0, 60000000000])
        .range([height - marginsOrig.bottom, marginsOrig.top]);

    const mapColor = d3.scaleOrdinal()
        .domain(["AMD", "Huawei", "NVIDIA"])
        .range(["#904046", "#D36E70", "#31978F"]);

    // DECLARAMOS AS DATAS AQUI EM CIMA PARA USAR NAS LINHAS E NOS TEXTOS
    const exactDates = [
        new Date(2008, 5, 16),
        new Date(2011, 10, 4),
        new Date(2014, 6, 31),
        new Date(2017, 3, 26),
        new Date(2020, 0, 21),
        new Date(2022, 9, 17)
    ];

    // 1. Gridlines (Linhas pontilhadas de fundo)
    // Verticais (Agora alinhadas perfeitamente com as datas)
    svg.append("g")
        .attr("transform", `translate(0, ${height - marginsOrig.bottom})`)
        .call(d3.axisBottom(mapX)
            .tickValues(exactDates) // <-- Correção aplicada aqui
            .tickSize(-(height - marginsOrig.top - marginsOrig.bottom))
            .tickFormat("")
        )
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").attr("stroke", "#e5e5e5").attr("stroke-dasharray", "3,3"));

    // Horizontais (Eixo X base no 0)
    svg.append("g")
        .attr("transform", `translate(${marginsOrig.left}, 0)`)
        .call(d3.axisLeft(mapY)
            .tickValues([0, 10e9, 20e9, 30e9, 40e9, 50e9])
            .tickSize(-(width - marginsOrig.left - marginsOrig.right))
            .tickFormat("")
        )
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line")
            .attr("stroke", d => d === 0 ? "#888" : "#e5e5e5")
            .attr("stroke-dasharray", d => d === 0 ? "none" : "3,3")
        );

    // 2. Eixos (Apenas os textos formatados)
    const xAxis = d3.axisBottom(mapX)
        .tickValues(exactDates)
        .tickFormat(d3.timeFormat("%b %d, %Y")); 
    
    svg.append('g')
        .attr('transform', `translate(0, ${height - marginsOrig.bottom})`)
        .call(xAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").remove())
        .selectAll("text").style("fill", "#555").style("font-size", "12px");

    const yAxis = d3.axisLeft(mapY)
        .tickValues([0, 10e9, 20e9, 30e9, 40e9, 50e9])
        .tickFormat(d => d === 0 ? "0" : `${d / 1e9} billion`);
    
    svg.append('g')
        .attr('transform', `translate(${marginsOrig.left}, 0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").remove())
        .selectAll("text").style("fill", "#555").style("font-size", "12px");

    // Título do Eixo Y
    svg.append('text')
        .attr('x', marginsOrig.left)
        .attr('y', marginsOrig.top - 20)
        .style("text-anchor", "start")
        .style("font-size", "13px")
        .style("font-weight", "bold")
        .style("fill", "#555")
        .text("GPU performance per dollar (FLOP/s/$)");

    // 3. Marcas Visuais (Pontos coloridos)
    svg.selectAll('circle')
        .data(parsedData)
        .enter().append('circle')
        .attr('cx', d => mapX(d.release_date))
        .attr('cy', d => mapY(d.perf))
        .attr('r', 4.5)
        .style('fill', d => mapColor(d.manufacturer));

    // 4. Rótulos Específicos
    const labelsToShow = [
        "AMD Radeon RX 7900 XTX", "NVIDIA GeForce RTX 4090", "NVIDIA GeForce RTX 3080",
        "NVIDIA GeForce RTX 3090", "NVIDIA GeForce GTX 1080", "NVIDIA GeForce GTX 980",
        "NVIDIA GeForce GTX TITAN", "NVIDIA Tesla K20X", "NVIDIA GeForce GTX 280",
        "NVIDIA L20 PCIe", "NVIDIA A10 PCIe", "NVIDIA Quadro RTX 4000", "NVIDIA Tesla V100 PCIe 16 GB"
    ];

    svg.selectAll('.label')
        .data(parsedData.filter(d => labelsToShow.includes(d.entity)))
        .enter().append('text')
        .attr('class', 'label')
        .attr('x', d => {
            const leftAligned = ["7900 XTX", "4090", "3080", "3090", "1080", "V100"];
            if(leftAligned.some(str => d.entity.includes(str))) return mapX(d.release_date) - 8;
            return mapX(d.release_date) + 8;
        })
        .attr('y', d => {
            const leftAligned = ["7900", "4090", "3080", "3090", "1080"];
            if(leftAligned.some(str => d.entity.includes(str))) return mapY(d.perf) - 5;
            return mapY(d.perf) + 4;
        })
        .style('text-anchor', d => {
            const leftAligned = ["7900", "4090", "3080", "3090", "1080", "V100"];
            if(leftAligned.some(str => d.entity.includes(str))) return 'end';
            return 'start';
        })
        .style('font-size', '11.5px')
        .style('fill', d => mapColor(d.manufacturer))
        .text(d => d.entity);

    // 5. Legenda (Canto Superior Direito)
    const legend = svg.append('g').attr('transform', `translate(${width - 120}, ${marginsOrig.top})`);
    
    legend.append('text')
        .attr('x', 0).attr('y', -10)
        .style('font-size', '13px').style('font-weight', 'bold')
        .style('fill', '#000')
        .text('Manufacturer');

    const manufacturers = ["AMD", "Huawei", "NVIDIA"];
    manufacturers.forEach((m, i) => {
        const row = legend.append('g').attr('transform', `translate(0, ${5 + i * 18})`);
        row.append('rect').attr('width', 10).attr('height', 10).attr('fill', mapColor(m));
        row.append('text').attr('x', 16).attr('y', 9).style('font-size', '12px').style('fill', '#333').text(m);
    });
}

/**
 * DESIGN A: Scatterplot com Escala Logarítmica e Tooltips
 * Resolve o overplotting da original
 */
export function renderDesignA(data, selector) {
    const svg = d3.select(selector);
    const width = +svg.style("width").split("px")[0];
    const height = +svg.style("height").split("px")[0];

    svg.selectAll("*").remove();

    const parsedData = data.map(d => ({
        ...d,
        release_date: new Date(d.release_date),
        perf: Number(d.perf)
    }));

    const mapX = d3.scaleTime()
        .domain(d3.extent(parsedData, d => d.release_date))
        .range([margins.left, width - margins.right]);

    // Solução 1: Escala Logarítmica
    const perfExtent = d3.extent(parsedData, d => d.perf);
    const mapY = d3.scaleLog()
        .domain([perfExtent[0] * 0.8, perfExtent[1] * 1.2])
        .range([height - margins.bottom, margins.top]);

    const mapColor = d3.scaleOrdinal()
        .domain(["AMD", "NVIDIA", "Huawei"])
        .range(["#E63946", "#2A9D8F", "#8D99AE"]);

    const xAxis = d3.axisBottom(mapX).ticks(6);
    svg.append('g').attr('transform', `translate(0, ${height - margins.bottom})`).call(xAxis);

    const yAxis = d3.axisLeft(mapY).ticks(10, "~s");
    svg.append('g').attr('transform', `translate(${margins.left}, 0)`).call(yAxis);

    svg.append('text')
        .attr("transform", "rotate(-90)")
        .attr("y", margins.left / 2)
        .attr("x", -((height) / 2))
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("FLOP/s/$ (Escala Logarítmica)");

    let tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) { tooltip = d3.select("body").append("div").attr("class", "tooltip"); }

    // Solução 2: Limpeza dos textos + Tooltips interativos
    svg.selectAll('circle')
        .data(parsedData)
        .enter().append('circle')
        .attr('cx', d => mapX(d.release_date))
        .attr('cy', d => mapY(d.perf))
        .attr('r', 6)
        .style('fill', d => mapColor(d.manufacturer))
        .style('opacity', 0.7)
        .style('stroke', '#fff')
        .style('stroke-width', '1px')
        .on("mouseover", function(event, d) {
            d3.select(this).style('stroke', '#000').style('stroke-width', '2px');
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`<strong>${d.entity}</strong><br>Fab: ${d.manufacturer}<br>Data: ${d.release_date.getFullYear()}<br>Perf: ${(d.perf / 1e9).toFixed(1)} Bilhões FLOP/s/$`)
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).style('stroke', '#fff').style('stroke-width', '1px');
            tooltip.transition().duration(500).style("opacity", 0);
        });
}

/**
 * DESIGN B: Gráfico de Barras Horizontais (Ranking Top 15)
 */
export function renderDesignB(data, selector) {
    const marginsB = { left: 250, right: 30, top: 40, bottom: 60 };
    const svg = d3.select(selector);
    const width = +svg.style("width").split("px")[0];
    const height = +svg.style("height").split("px")[0];

    svg.selectAll("*").remove();

    const parsedData = data.map(d => ({ ...d, perf: Number(d.perf) }));

    const mapX = d3.scaleLinear()
        .domain([0, d3.max(parsedData, d => d.perf)])
        .range([marginsB.left, width - marginsB.right]);

    const mapY = d3.scaleBand()
        .domain(parsedData.map(d => d.entity))
        .range([marginsB.top, height - marginsB.bottom])
        .padding(0.2);

    const mapColor = d3.scaleOrdinal()
        .domain(["AMD", "NVIDIA", "Huawei"])
        .range(["#E63946", "#2A9D8F", "#8D99AE"]);

    const xAxis = d3.axisBottom(mapX)
        .ticks(5)
        .tickFormat(d => d === 0 ? "0" : `${d / 1e9} bi`);
    svg.append('g').attr('transform', `translate(0, ${height - marginsB.bottom})`).call(xAxis);

    const yAxis = d3.axisLeft(mapY);
    svg.append('g').attr('transform', `translate(${marginsB.left}, 0)`).call(yAxis)
        .selectAll("text").style("font-size", "11px");

    svg.append('text')
        .attr('x', marginsB.left + (width - marginsB.left - marginsB.right) / 2)
        .attr('y', height - 10)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("GPU performance per dollar (Bilhões de FLOP/s/$)");

    svg.selectAll('rect')
        .data(parsedData)
        .enter().append('rect')
        .attr('x', mapX(0))
        .attr('y', d => mapY(d.entity))
        .attr('width', d => mapX(d.perf) - mapX(0))
        .attr('height', mapY.bandwidth())
        .style('fill', d => mapColor(d.manufacturer))
        .style('opacity', 0.9);
}