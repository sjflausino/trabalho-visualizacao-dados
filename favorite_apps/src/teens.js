import { loadDb } from './db.js';

// Usamos ?url para o Vite empacotar o CSV corretamente, assim como no projeto GPU
import csvUrl from '../teens-favorite-apps.csv?url';

export class Teens {
    async init() {
        this.db = await loadDb();
        this.conn = await this.db.connect();
        this.table = 'teens_data';
    }

    async loadTeens() {
        if (!this.db || !this.conn)
            throw new Error('A base de dados não foi inicializada. Chame init() primeiro.');

        const res = await fetch(csvUrl);
        
        if (!res.ok) {
            throw new Error('Não foi possível carregar o arquivo teens-favorite-apps.csv local.');
        }

        await this.db.registerFileBuffer('teens_virtual.csv', new Uint8Array(await res.arrayBuffer()));

        await this.conn.query(`
            CREATE TABLE ${this.table} AS
            SELECT
              CAST(Date AS DATE) AS date,
              App AS app,
              CAST("% of Teens" AS DOUBLE) * 100 AS value,
              "Survey Date" AS survey
            FROM read_csv_auto('teens_virtual.csv');
        `);
    }

    async query(sql) {
        if (!this.db || !this.conn)
            throw new Error('A base de dados não foi inicializada. Chame init() primeiro.');

        let result = await this.conn.query(sql);
        // Conversão nativa de Arrow para JS Objects
        return result.toArray().map(row => {
            const obj = row.toJSON();
            // Normaliza a data (o DuckDB WebAssembly pode devolver timestamps numéricos)
            if (typeof obj.date === 'number') {
                obj.date = new Date(obj.date > 1e7 ? obj.date : obj.date * 86400000);
            }
            return obj;
        });
    }
}