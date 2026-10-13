import * as d3 from "d3";

// Caminho do arquivo CSV.
const arquivo = "/data/north_america_bear_killings.csv";

let tooltip;

// Carrega os dados e inicia os gráficos.
async function iniciar() {
  try {
    const dados = await d3.csv(arquivo);

    // Converte os campos para os tipos necessários.
    dados.forEach((d) => {
      d.Year = Number(d.Year);

      // O CSV pode ter a coluna "age" ou " age".
      const idade = d.age ?? d[" age"];

      // Mantém idades ausentes como null.
      d.age =
        idade == null || String(idade).trim() === ""
          ? null
          : Number(idade);
    });

    // Cria um único tooltip compartilhado pelos dois gráficos.
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .attr("role", "status")
      .attr("aria-live", "polite");

    desenharDecadas(dados);
    desenharIdades(dados);
  } catch (erro) {
    console.error("Erro ao carregar os dados ou criar os gráficos:", erro);

    document.body.insertAdjacentHTML(
      "beforeend",
      `<p class="erro">Não foi possível gerar os gráficos: ${erro.message}</p>`
    );
  }
}

// Configura os eventos interativos do tooltip.
function configurarTooltip(barras, obterTexto) {
  barras
    .attr("tabindex", 0)
    .attr("aria-label", (d) => obterTexto(d))
    .on("mouseenter", function (event, d) {
      tooltip
        .text(obterTexto(d))
        .classed("visivel", true);

      posicionarTooltip(event.pageX, event.pageY);
    })
    .on("mousemove", function (event) {
      posicionarTooltip(event.pageX, event.pageY);
    })
    .on("mouseleave", function () {
      tooltip.classed("visivel", false);
    })
    .on("focus", function (event, d) {
      tooltip
        .text(obterTexto(d))
        .classed("visivel", true);

      const retangulo = this.getBoundingClientRect();

      posicionarTooltip(
        retangulo.left + window.scrollX,
        retangulo.bottom + window.scrollY
      );
    })
    .on("blur", function () {
      tooltip.classed("visivel", false);
    });
}

// Posiciona o tooltip sem deixá-lo fora da janela.
function posicionarTooltip(x, y) {
  const elemento = tooltip.node();
  const margem = 12;

  // Mede o tooltip depois que seu conteúdo foi atualizado.
  const largura = elemento.offsetWidth;
  const altura = elemento.offsetHeight;

  const limiteEsquerdo = window.scrollX;
  const limiteSuperior = window.scrollY;
  const limiteDireito = limiteEsquerdo + window.innerWidth;
  const limiteInferior = limiteSuperior + window.innerHeight;

  // Tenta posicionar à direita do ponteiro.
  let esquerda = x + margem;

  // Se faltar espaço, posiciona à esquerda.
  if (esquerda + largura > limiteDireito - 4) {
    esquerda = x - largura - margem;
  }

  // Tenta posicionar abaixo do ponteiro.
  let topo = y + margem;

  // Se faltar espaço, posiciona acima.
  if (topo + altura > limiteInferior - 4) {
    topo = y - altura - margem;
  }

  // Mantém a caixa dentro dos limites visíveis.
  esquerda = Math.max(
    limiteEsquerdo + 4,
    Math.min(esquerda, limiteDireito - largura - 4)
  );

  topo = Math.max(
    limiteSuperior + 4,
    Math.min(topo, limiteInferior - altura - 4)
  );

  tooltip
    .style("left", `${esquerda}px`)
    .style("top", `${topo}px`);
}

// Gráfico A: registros por década.
function desenharDecadas(dados) {
  const contagens = d3.rollups(
    dados.filter((d) => Number.isFinite(d.Year)),
    (grupo) => grupo.length,
    (d) => Math.floor(d.Year / 10) * 10
  )
    .map(([decada, quantidade]) => ({ decada, quantidade }))
    .sort((a, b) => d3.ascending(a.decada, b.decada));

  const largura = 800;
  const altura = 420;
  const margem = { top: 35, right: 30, bottom: 70, left: 75 };

  const svg = d3.select("#chart-decades")
    .append("svg")
    .attr("viewBox", `0 0 ${largura} ${altura}`)
    .attr("role", "img")
    .attr("aria-label", "Registros de vítimas fatais por década");

  const x = d3.scaleBand()
    .domain(contagens.map((d) => d.decada))
    .range([margem.left, largura - margem.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(contagens, (d) => d.quantidade) * 1.15])
    .nice()
    .range([altura - margem.bottom, margem.top]);

  // Eixo X: décadas.
  svg.append("g")
    .attr("transform", `translate(0,${altura - margem.bottom})`)
    .call(
      d3.axisBottom(x)
        .tickFormat((d) => `${d}s`)
    )
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  // Eixo Y: quantidade de registros.
  svg.append("g")
    .attr("transform", `translate(${margem.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format("d")));

  // Título do eixo vertical.
  svg.append("text")
    .attr("x", margem.left)
    .attr("y", 18)
    .attr("text-anchor", "start")
    .attr("class", "titulo-eixo")
    .text("Registros de vítimas fatais");

  // Título do eixo horizontal.
  svg.append("text")
    .attr("x", (margem.left + largura - margem.right) / 2)
    .attr("y", altura - 8)
    .attr("text-anchor", "middle")
    .attr("class", "titulo-eixo")
    .text("Década");

  // Identifica a maior contagem.
  const maiorQuantidade = d3.max(
    contagens,
    (d) => d.quantidade
  );

  // Cria as barras e destaca a maior contagem.
  const barras = svg.selectAll(".barra-decada")
    .data(contagens)
    .join("rect")
    .attr("class", "barra-decada")
    .attr("x", (d) => x(d.decada))
    .attr("y", (d) => y(d.quantidade))
    .attr("width", x.bandwidth())
    .attr("height", (d) => y(0) - y(d.quantidade))
    .attr("fill", (d) =>
      d.quantidade === maiorQuantidade ? "#174f75" : "#a9cde3"
    )
    .attr("stroke", (d) =>
      d.quantidade === maiorQuantidade ? "#123c59" : "none"
    )
    .attr("stroke-width", 1.5);

  // Ativa o tooltip nas barras.
  configurarTooltip(
    barras,
    (d) =>
      `Década: ${d.decada}–${d.decada + 9}\nRegistros: ${d.quantidade}`
  );

  // Valores acima das barras.
  svg.selectAll(".valor")
    .data(contagens)
    .join("text")
    .attr("class", "valor")
    .attr("x", (d) => x(d.decada) + x.bandwidth() / 2)
    .attr("y", (d) => y(d.quantidade) - 6)
    .attr("text-anchor", "middle")
    .text((d) => d.quantidade);
}

// Gráfico B: distribuição das idades das vítimas.
function desenharIdades(dados) {
  // Mantém somente registros com idade válida.
  const dadosValidos = dados.filter(
    (d) => d.age !== null && Number.isFinite(d.age) && d.age >= 0
  );

  // Agrupa as idades em intervalos de dez anos.
  const contagens = d3.rollups(
    dadosValidos,
    (grupo) => grupo.length,
    (d) => Math.floor(d.age / 10) * 10
  )
    .map(([inicio, quantidade]) => ({
      inicio,
      faixa: `${inicio}–${inicio + 9}`,
      quantidade
    }))
    .sort((a, b) => d3.ascending(a.inicio, b.inicio));

  const largura = 800;
  const altura = 380;
  const margem = { top: 35, right: 30, bottom: 80, left: 75 };

  const svg = d3.select("#chart-bears")
    .append("svg")
    .attr("viewBox", `0 0 ${largura} ${altura}`)
    .attr("role", "img")
    .attr(
      "aria-label",
      "Distribuição dos registros de vítimas fatais por faixa etária"
    );

  const x = d3.scaleBand()
    .domain(contagens.map((d) => d.faixa))
    .range([margem.left, largura - margem.right])
    .padding(0.18);

  const y = d3.scaleLinear()
    .domain([0, d3.max(contagens, (d) => d.quantidade) * 1.2])
    .nice()
    .range([altura - margem.bottom, margem.top]);

  // Eixo X: faixas etárias.
  svg.append("g")
    .attr("transform", `translate(0,${altura - margem.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end");

  // Eixo Y: quantidade de registros.
  svg.append("g")
    .attr("transform", `translate(${margem.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format("d")));

  // Título do eixo vertical.
  svg.append("text")
    .attr("x", margem.left)
    .attr("y", 18)
    .attr("text-anchor", "start")
    .attr("class", "titulo-eixo")
    .text("Quantidade de registros");

  // Título do eixo horizontal.
  svg.append("text")
    .attr("x", (margem.left + largura - margem.right) / 2)
    .attr("y", altura - 8)
    .attr("text-anchor", "middle")
    .attr("class", "titulo-eixo")
    .text("Faixa etária (anos)");

  // Identifica a maior contagem.
  const maiorQuantidade = d3.max(
    contagens,
    (d) => d.quantidade
  );

  // Cria as barras e destaca a maior contagem.
  const barras = svg.selectAll(".barra-idade")
    .data(contagens)
    .join("rect")
    .attr("class", "barra-idade")
    .attr("x", (d) => x(d.faixa))
    .attr("y", (d) => y(d.quantidade))
    .attr("width", x.bandwidth())
    .attr("height", (d) => y(0) - y(d.quantidade))
    .attr("fill", (d) =>
      d.quantidade === maiorQuantidade ? "#523579" : "#c7b9df"
    )
    .attr("stroke", (d) =>
      d.quantidade === maiorQuantidade ? "#382451" : "none"
    )
    .attr("stroke-width", 1.5);

  // Ativa o tooltip nas barras.
  configurarTooltip(
    barras,
    (d) =>
      `Faixa etária: ${d.faixa} anos\nRegistros: ${d.quantidade}`
  );

  // Valores acima das barras.
  svg.selectAll(".valor")
    .data(contagens)
    .join("text")
    .attr("class", "valor")
    .attr("x", (d) => x(d.faixa) + x.bandwidth() / 2)
    .attr("y", (d) => y(d.quantidade) - 6)
    .attr("text-anchor", "middle")
    .text((d) => d.quantidade);

  // Informa quantos registros foram utilizados.
  const ausentes = dados.length - dadosValidos.length;

  d3.select("#chart-bears")
    .append("p")
    .attr("class", "nota")
    .text(
      `${dadosValidos.length} registros com idade válida; ` +
      `${ausentes} registros sem idade válida foram excluídos.`
    );
}

iniciar();
