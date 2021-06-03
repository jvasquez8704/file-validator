const { Pool } = require('pg');

//todo => this helper has to be singleton
const pool = new Pool({
    host: process.env.HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    port: process.env.DB_PORT
});
    
module.exports = {
    pool
}