// Node nodemon => for live reload
// npm i -g nodemon => debe ser instalado de forma global
//dotenv

//Instanciamos express
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { processExcelFile } = require('./util/files');

 //added to https and certificate support
const fs = require('fs');
const https = require('https');

//Creamos una instancia
const app = express();

//DB
// dbConnection();

//config cors
app.use(cors());

//Lectura y parseo de boby
app.use(express.json());

app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));

//Run ETL process

//configuramos
https.createServer({
    key: fs.readFileSync('certs/privkey1.pem'),
    cert: fs.readFileSync('certs/cert1.pem')
}, app).listen( process.env.PORT, () => {
    console.log( `Server started in port ${ process.env.PORT } ` );
});