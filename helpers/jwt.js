const jwt = require('jsonwebtoken');


const generateJWT = (uid, name) => {

    return new Promise((resolve, reject) => {

        const payload = { uid, name };
        jwt.sign(payload, process.env.SEED, {
            expiresIn: '2h'
        }, (err, token) => {

            if (err) {
                console.log(err)
                reject('No se puedo generar el token')
            }

            resolve(token);

        })
    })

}

module.exports = {
    generateJWT
}