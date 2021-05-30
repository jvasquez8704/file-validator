/**
 * evets routes
 * host + /api/events
 */
const { Router } = require('express');
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/events');
const { validateToken } = require('../middlewares/jwt-validator');
const { isDate } = require('../helpers/Dates');
const { check } = require('express-validator');
const { validateFields } = require('../middlewares/field-validator');
const router = Router();

router.use(validateToken);

//router.get('/', validateToken , getEvents)
router.get('/', getEvents)

router.post('/',
    [
        check('title', 'Es necesario un título').not().isEmpty(),
        check('start', 'Por favor validar fecha de inicio').custom(isDate),
        check('end', 'Por favor validar fecha de fin').custom(isDate),
        validateFields
    ],
    createEvent)

router.put('/:id',
    [
        check('title', 'Es necesario un título').not().isEmpty(),
        check('start', 'Por favor validar fecha de inicio').custom(isDate),
        check('end', 'Por favor validar fecha de fin').custom(isDate),
        validateFields
    ],
    updateEvent)

router.delete('/:id', deleteEvent)

module.exports = router
