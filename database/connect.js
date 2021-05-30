const { Pool, Client } = require('pg');

//todo => this helper has to be singleton
const dbConnection = async () => {
    try {
       const client = new Client({
            host:'localhost',
            user:'walletmachine',
            password:'',
            database:'testdb',
            port:'5432'
        });
        client.connect();
        console.log('Conexión exitosa...');
        return client;
    } catch (error) {
        console.log(error)
        throw new Error('Error al conectar con DB');
    }
}


const pool = new Pool({
    host:'localhost',
    user:'walletmachine',
    password:'',
    database:'testdb',
    port:'5432'
});

// const pool = new Pool({
//     host:'34.71.188.207',
//     user:'postgres',
//     password:'password',
//     database:'gke_test_regional',
//     port:'5432'
// });
    
  

module.exports = {
    dbConnection,
    pool
}