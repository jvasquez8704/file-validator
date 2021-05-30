/**
 * evets routes
 * host + /api/files
 */
 const { Router } = require('express');
 const { getFiles, getFile } = require('../controllers/files');


 const router = Router();
 
//  router.use(validateToken);
 
 router.get('/', getFiles);

//  router.get('/v1/', getFile);
 router.get('/:fileId', getFile);
 
 
 module.exports = router
 