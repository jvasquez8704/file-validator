// Node nodemon => for live reload
// npm i -g nodemon => debe ser instalado de forma global
//dotenv

//Instanciamos express
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const fileUpload = require('express-fileupload');
// const { dbConnection } = require('./database/config');

 

//Creamos una instancia
const app = express();

//DB
// dbConnection();

//config cors
app.use(cors());

//Public directory
//Middleware use
app.use(express.static('public'));

//Lectura y parseo de boby
app.use(express.json());

app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));

//Routes
//TODO : AUTH: 
//app.use('/api/auth', require('./routes/auth'));

//TODO : CRUD: Eventos
app.use('/api/files', require('./routes/files'));


//configuramos
app.listen( process.env.PORT, () => {
    console.log( `Server started in port ${ process.env.PORT } ` );
})