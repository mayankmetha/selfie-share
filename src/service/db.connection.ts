import { Connection } from 'mysql2';
import * as fs from 'fs';
import * as mysql from 'mysql2';

export class DbConnection {

    public constructor() {
        if (!DbConnection.connection) {
            const dbConfig = JSON.parse(fs.readFileSync(__dirname + '/../dbconfig.json', 'UTF-8'));
            DbConnection.connection = mysql.createConnection(<mysql.ConnectionOptions>{
                host: dbConfig.host,
                user: dbConfig.user,
                password: dbConfig.password,
                database: dbConfig.database
            });
        }
    }

    /**
     * As needed, convert this to a pool of connections.
     */
    public getConnection(): Connection {
        return DbConnection.connection;
    }

    private static connection: Connection;
}