import { loadDb } from './config';

// O sufixo "?url" diz ao Vite para empacotar este arquivo junto com o código
// e retornar o caminho correto para ser usado no fetch().
// Certifique-se de que o arquivo gpu.csv está dentro da pasta "src".
import csvUrl from '../gpu.csv?url';

export class Gpu {
    async init() {
        this.db = await loadDb();
        this.conn = await this.db.connect();
        this.table = 'gpu_data';
    }

    async loadGpu() {
        if (!this.db || !this.conn)
            throw new Error('A base de dados não foi inicializada. Chame init() primeiro.');

        // Usa a URL dinâmica gerada pelo Vite
        const res = await fetch(csvUrl);
        
        if (!res.ok) {
            throw new Error('Não foi possível carregar o arquivo gpu.csv local.');
        }

        // Registra o buffer do arquivo na memória virtual do DuckDB
        await this.db.registerFileBuffer('gpu_virtual.csv', new Uint8Array(await res.arrayBuffer()));

        // Cria a tabela utilizando o arquivo virtual
        await this.conn.query(`
            CREATE TABLE ${this.table} AS
                SELECT * 
                FROM read_csv_auto('gpu_virtual.csv');
        `);
    }

    async query(sql) {
        if (!this.db || !this.conn)
            throw new Error('A base de dados não foi inicializada. Chame init() primeiro.');

        let result = await this.conn.query(sql);
        return result.toArray().map(row => row.toJSON());
    }
}