import { Teens } from "./teens.js";
import { renderLineChart, renderBumpChart } from './plot.js';

window.onload = async () => {
    const teens = new Teens();
    await teens.init();
    await teens.loadTeens();

    // Query unificada: já traz os dados com arredondamento e calcula o ranking usando SQL
    const sql = `
        WITH base AS (
          SELECT
            date, app, survey,
            ROUND(value) AS value,
            AVG(value) OVER (PARTITION BY app) AS avg_app
          FROM teens_data
        )
        SELECT
          date, app, survey, value,
          ROW_NUMBER() OVER (PARTITION BY date ORDER BY value DESC, avg_app DESC) AS rank
        FROM base
        ORDER BY app, date ASC;
    `;
    
    const rawData = await teens.query(sql);
    
    // CORREÇÃO: Força a conversão de BigInt para Number do JavaScript
    const data = rawData.map(d => ({
        ...d,
        rank: Number(d.rank),
        value: Number(d.value)
    }));

    // Seletores
    const btnLine = document.getElementById("btn-line");
    const btnBump = document.getElementById("btn-bump");
    const selector = "#mainChart"; // SVG único

    // Renderiza o padrão
    renderLineChart(data, selector);

    // Alternância de abas
    function setActiveButton(activeBtn) {
        [btnLine, btnBump].forEach(btn => btn.classList.remove("active"));
        activeBtn.classList.add("active");
    }

    btnLine.addEventListener("click", () => {
        setActiveButton(btnLine);
        renderLineChart(data, selector);
    });

    btnBump.addEventListener("click", () => {
        setActiveButton(btnBump);
        renderBumpChart(data, selector);
    });
};