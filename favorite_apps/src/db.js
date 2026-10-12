// ============================================================
// db.js
// Inicializa o DuckDB-WASM (DuckDB rodando no navegador).
// O Vite empacota os arquivos .wasm e os workers via "?url".
// ============================================================
import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm     from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker      from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh  from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker       from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

// Duas versões do DuckDB: "mvp" (compatível com tudo) e "eh" (mais rápida)
const MANUAL_BUNDLES = {
  mvp: { mainModule: duckdb_wasm,    mainWorker: mvp_worker },
  eh:  { mainModule: duckdb_wasm_eh, mainWorker: eh_worker  },
};

export async function loadDb() {
  // Escolhe automaticamente a melhor versão suportada pelo navegador
  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

  // O DuckDB roda dentro de um Web Worker, para não travar a página
  const worker = new Worker(bundle.mainWorker);
  const logger = new duckdb.ConsoleLogger();
  const db     = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  return db;
}
