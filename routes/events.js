/**
 * evets routes
 * host + /api/events
 */
const { Router } = require('express');
const { processFile } = require('../controllers/events');
const router = Router();

router.get('/', processFile);


module.exports = router
