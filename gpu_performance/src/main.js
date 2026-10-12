import { Gpu } from "./gpu";
import { renderOriginal, renderDesignA, renderDesignB } from './plot';

window.onload = async () => {
    const gpu = new Gpu();
    await gpu.init();
    await gpu.loadGpu();

    // Consulta para o Gráfico Original e Design A (Série Temporal Completa)
    const sqlA = `
        SELECT
            Entity as entity,
            CAST(Day AS DATE) as release_date,
            "GPU performance per dollar" as perf,
            Manufacturer as manufacturer
        FROM gpu_data
        ORDER BY release_date ASC
    `;
    const dataA = await gpu.query(sqlA);

    // Consulta para o Design B (Ranking Top 15 focado nas melhores)
    const sqlB = `
        SELECT
            Entity as entity,
            "GPU performance per dollar" as perf,
            Manufacturer as manufacturer
        FROM gpu_data
        ORDER BY perf DESC
        LIMIT 15
    `;
    const dataB = await gpu.query(sqlB);

    // Seletores do DOM
    const btnOriginal = document.getElementById("btn-original");
    const btnDesignA = document.getElementById("btn-designA");
    const btnDesignB = document.getElementById("btn-designB");
    const selector = "#mainChart"; // Único SVG

    // Renderiza o Gráfico Original ao abrir a página
    renderOriginal(dataA, selector);

    // Função auxiliar para mudar a cor do botão ativo
    function setActiveButton(activeBtn) {
        [btnOriginal, btnDesignA, btnDesignB].forEach(btn => btn.classList.remove("active"));
        activeBtn.classList.add("active");
    }

    // Eventos de Clique
    btnOriginal.addEventListener("click", () => {
        setActiveButton(btnOriginal);
        renderOriginal(dataA, selector);
    });

    btnDesignA.addEventListener("click", () => {
        setActiveButton(btnDesignA);
        renderDesignA(dataA, selector);
    });

    btnDesignB.addEventListener("click", () => {
        setActiveButton(btnDesignB);
        renderDesignB(dataB, selector);
    });
};