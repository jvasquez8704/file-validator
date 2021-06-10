/**
 * evets routes
 * host + /api/files
 */
 const { Router } = require('express');
 const { uploadFiles, processFile } = require('../controllers/files');
 var cors = require('cors');

 const router = Router();
 
 var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }

//  router.use(validateToken);
 
 router.post('/',cors(corsOptions), uploadFiles);
 router.get('/', processFile );

//  router.get('/v1/', getFile);
//  router.get('/:fileId', getFile);
 
 
 module.exports = router
 