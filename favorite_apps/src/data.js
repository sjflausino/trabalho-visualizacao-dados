// ============================================================
// data.js
// Carrega o CSV no DuckDB (WebAssembly) e usa SQL para:
//   1) VALIDAR os dados;
//   2) TRANSFORMAR os dados (tipos, escala em %, ranking por pesquisa).
// Devolve um array pronto para os gráficos em D3.
// ============================================================
import { loadDb } from './db.js';

// O Arrow (formato que o DuckDB devolve) pode entregar datas como
// Date, milissegundos, dias desde 1970 ou texto. Aqui normalizamos tudo para Date.
const toJSDate = v => {
  if (v instanceof Date) return v;
  if (typeof v === 'bigint') v = Number(v);
  if (typeof v === 'number') return new Date(v > 1e7 ? v : v * 86400000); // ms ou dias
  return new Date(v);
};

export async function loadData() {
  // ---------- 1. Inicia o DuckDB e abre uma conexão ----------
  const db = await loadDb();
  const conn = await db.connect();

  // ---------- 2. Baixa o CSV e registra como arquivo virtual no DuckDB ----------
  const csvRes = await fetch('/teens-favorite-apps.csv');
  const csvText = await csvRes.text();

  // Se o Vite não achar o arquivo, ele devolve o index.html; detectamos isso aqui
  if (!csvRes.ok || csvText.trimStart().startsWith('<')) {
    throw new Error('CSV não encontrado em /teens-favorite-apps.csv');
  }

  await db.registerFileText('teens.csv', csvText);

  // ---------- 3. Cria a tabela já com tipos corretos ----------
  // - Date vira DATE
  // - "% of Teens" (0.47) vira percentual (47)
  await conn.query(`
    CREATE TABLE teens AS
    SELECT
      CAST(Date AS DATE)                 AS date,
      App                                AS app,
      CAST("% of Teens" AS DOUBLE) * 100 AS value,
      "Survey Date"                      AS survey
    FROM read_csv_auto('teens.csv');
  `);

  // ---------- 4. VALIDAÇÃO dos dados (feita em SQL) ----------
  // Confere: número de linhas, apps e pesquisas; valores nulos ou fora de 0–100;
  // e a maior soma de % em uma mesma pesquisa (não pode passar de 100).
  const validationResult = await conn.query(`
    SELECT
      COUNT(*)                                                       AS linhas,
      COUNT(DISTINCT app)                                            AS apps,
      COUNT(DISTINCT date)                                           AS pesquisas,
      COUNT(*) FILTER (WHERE value IS NULL OR value < 0 OR value > 100) AS invalidos,
      (SELECT MAX(soma)
         FROM (SELECT SUM(value) AS soma FROM teens GROUP BY date))  AS maior_soma
    FROM teens;
  `);
  const v = validationResult.toArray()[0];
  const check = {
    linhas:     Number(v.linhas),
    apps:       Number(v.apps),
    pesquisas:  Number(v.pesquisas),
    invalidos:  Number(v.invalidos),
    maiorSoma:  Number(v.maior_soma),
  };
  console.log('Validação dos dados (DuckDB):', check);

  // Todo app deve ter uma linha em cada pesquisa, sem valores inválidos
  if (check.invalidos > 0 || check.linhas !== check.apps * check.pesquisas || check.maiorSoma > 100.5) {
    throw new Error('Dados inconsistentes: ' + JSON.stringify(check));
  }

  // ---------- 5. TRANSFORMAÇÃO: valores arredondados + ranking por pesquisa ----------
  // ROW_NUMBER() numera os apps de cada pesquisa do maior para o menor %.
  // Em caso de empate, quem tem a maior média em todas as pesquisas fica na frente.
  const result = await conn.query(`
    WITH base AS (
      SELECT
        date, app, survey,
        ROUND(value)               AS value,
        AVG(value) OVER (PARTITION BY app) AS avg_app
      FROM teens
    )
    SELECT
      date, app, survey, value,
      ROW_NUMBER() OVER (PARTITION BY date ORDER BY value DESC, avg_app DESC) AS rank
    FROM base
    ORDER BY app, date;
  `);

  await conn.close();

  // ---------- 6. Converte o resultado do DuckDB em objetos JavaScript simples ----------
  const rows = result.toArray().map(r => ({
    date:   toJSDate(r.date),
    app:    r.app,
    value:  Number(r.value),
    survey: r.survey,
    rank:   Number(r.rank),   // posição na pesquisa (1 = mais votado)
  }));

  return { rows };
}
