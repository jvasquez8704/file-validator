const { response } = require('express');
const jwt = require('jsonwebtoken');

const validateToken = (req, res, next) => {

    const token = req.header('x-token');

    if(!token){
      return res.status(401).json({
          ok:false,
          mjs:'Usuario no atenticado'
      });
    }

    try {
        //const payload = jwt.verify(
        const { uid, name } = jwt.verify(
            token,
            process.env.SEED
        );

        req.uid = uid;
        req.name = name;

    } catch (error) {
        console.log(error);
        return res.status(401).json({
            ok:false,
            mjs:'Usuario no atenticado'
        });
    }

    next();
}

module.exports = {
    validateToken
}