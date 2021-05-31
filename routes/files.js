/**
 * evets routes
 * host + /api/files
 */
 const { Router } = require('express');
 const { uploadFiles, processFile } = require('../controllers/files');


 const router = Router();
 
//  router.use(validateToken);
 
 router.post('/', uploadFiles);
 router.get('/', processFile );

//  router.get('/v1/', getFile);
//  router.get('/:fileId', getFile);
 
 
 module.exports = router
 