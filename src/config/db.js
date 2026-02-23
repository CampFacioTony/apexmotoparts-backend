const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'root',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'apexmotoparts_db',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5437,
});

pool.on('connect', () => {
    console.log('🔗 Conexión exitosa a PostgreSQL');
});

module.exports = pool;