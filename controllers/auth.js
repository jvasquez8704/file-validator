const { response } = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateJWT } = require('../helpers/jwt');
const jwt = require('../helpers/jwt');
//const { validationResult } = require('express-validator');

const createUser = async (req, res = response) => {
    const { email, password } = req.body;
    //Manual validations
    /*if (!user.name || user.name.length < 0 ) {
        return res.status(400).json({ // tiene que ir el return para evitar el error de enviar multiples response
            ok: false,
            msj: 'Username not fit with criteria',
            user
        });
    }*/

    //with express-validator
    /*const errors = validationResult( req );
    if(!errors.isEmpty()){
        return res.status(400).json({
            ok: false,
            errors: errors.mapped()
        })
    }*/
    try {
        let user = await User.findOne({ email })

        if (user) {
            return res.status(400).json({
                ok: false,
                mjs: 'Un usuario ya existe con este correo'
            });
        }

        user = User(req.body);

        //Cifrar contraseña
        const salt = bcrypt.genSaltSync();
        user.password = bcrypt.hashSync(password, salt);

        await user.save();

        //Generar JWT
        const token = await generateJWT( user.id, user.name );

        res.status(201).json({ // el return no hace falta aqui, es implicito
            ok: true,
            uid: user.id,
            name: user.name,
            token
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({
            ok: false,
            msj: 'Error, comuniquese con el administrador',
        });
    }
};

const autentication = async (req, res = response) => {
    /*const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            ok: false,
            errors: errors.mapped()
        })
    }*/

    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({
                ok: false,
                mjs: 'Usuario o contraseña invalida'
            });
        }

        //Cifrar contraseña
        const validPassword = bcrypt.compareSync(password, user.password);

        if (!validPassword) {
            return res.status(400).json({
                ok: false,
                mjs: 'Contraseña incorrecta'
            });
        }

        //Generar JWT
        const token = await generateJWT( user.id, user.name );
        
        res.status(201).json({ // el return no hace falta aqui, es implicito
            ok: true,
            uid: user.id,
            name: user.name,
            token
        });

        

    } catch (error) {
        console.log(error)
        res.status(500).json({
            ok: false,
            msj: 'Error, comuniquese con el administrador',
        });
    }
};

const reliveToken = async (req, res = response) => {

    const { uid, name } = req;
    const token = await generateJWT( uid , name );

    res.json({
        ok: true,
        uid,
        name,
        token
    });
};

module.exports = {
    createUser,
    autentication,
    reliveToken
}