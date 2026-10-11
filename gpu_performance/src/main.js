import { Gpu } from "./gpu";
import { loadChart, clearChart } from './plot';

function callbacks(data) {
    const loadBtn  = document.querySelector('#loadBtn');
    const clearBtn = document.querySelector('#clearBtn');

    if (!loadBtn || !clearBtn) {
        return;
    }

    loadBtn.addEventListener('click', async () => {
        await loadChart(data);
    });

    clearBtn.addEventListener('click', async () => {
        clearChart();
    });
}

window.onload = async () => {
    const gpu = new Gpu();

    await gpu.init();
    await gpu.loadGpu();

    // Query extraindo os atributos que vamos mapear visualmente
    const sql = `
        SELECT
            Entity as entity,
            CAST(Day AS DATE) as release_date,
            "GPU performance per dollar" as perf,
            Manufacturer as manufacturer
        FROM
            gpu_data
        ORDER BY release_date ASC
    `;

    const data = await gpu.query(sql);
    console.log("Dados carregados:", data);

    callbacks(data);
};