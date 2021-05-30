/**
 * auth routes
 * host + /api/auth
 */
// npm i express-validator
const { Router } = require('express');
const { check } = require('express-validator');
const { createUser, reliveToken, autentication } = require('../controllers/auth');
const { validateFields } = require('../middlewares/field-validator');
const { validateToken } = require('../middlewares/jwt-validator');
const router = Router();


router.post('/',
    [
        check('email', 'El email es obligatorio').isEmail(),
        check('password', 'El password debe tener al menos 6 caracteres').isLength({ min : 6 }),
        validateFields //custom middleware
    ],
    autentication
    );

router.post('/new',
    [//middlewares
        check('name', 'El nombre es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').isEmail(),
        check('password', 'El password debe tener al menos 6 caracteres').isLength({ min : 6 }),
        validateFields
    ],
    createUser);

router.get('/renew', validateToken ,reliveToken);



module.exports = router;