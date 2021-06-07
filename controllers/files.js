const { response } = require('express');
const path = require('path');
const fs = require('fs');
const { pool } = require('../database/connect');

const uploadFiles =  async (req, res = response) => {
    const { author } = req.body;
    let sampleFile;
    let uploadPath;

    if (!author) {
        res.status(400).json({
            status: { code: 400, message: 'This service needs a autor', errors: null},
            data: null
        });
    }

    if (!req.files || Object.keys(req.files).length === 0 || !req.files.codingFile) {
        res.status(400).json({
            status: { code: 400, message: 'No files were uploaded.', errors: null},
            data: null
        });
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    sampleFile = req.files.codingFile;
    // uploadPath = __dirname + '/files/' + sampleFile.name;
    uploadUserPath = path.join(__dirname,  `../uploads/${author}/`);
    if (!fs.existsSync(uploadUserPath)) fs.mkdirSync(uploadUserPath);
    
    // uploadPath = path.join(__dirname,  '../uploads/' , sampleFile.name);
    uploadPath = path.join(uploadUserPath , sampleFile.name);
    console.log('path => ', uploadPath);
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function(err) {
        if (err) {
            res.status(500).json({
                status: { code: 500, message: 'No files were uploaded.', errors: err },
                data: null
            });
        }
        _processFile(res ,uploadPath);
    });
};

const _processFile = async (res, _path) => {
    //1783(10%) => 178
    const minValueAllowed = 178;
    let statusCode = 200;
    let errors = null;
    const { content, headers, headersMap } = await _readFile('|', _path);
    const isHeaderValid = validateHeaders(headers);
    const { isDataValid, validations } = await validateContent(content);
    const isValidLength = minValueAllowed < validations.length;
    console.log(`data size::${ content.length }, rows allowed to validate::${ validations.length }, isValidMinLength::${ isValidLength }, header is valid::${ isHeaderValid }, data is valid::${ isDataValid }`);

    const isSaveData = isHeaderValid && isDataValid && isValidLength && await saveData( headersMap ,content );
    if ( !isSaveData ) {
        statusCode = 400;
        errors = {
            isValidMinLength: isValidLength,
            isHeaderValid: isHeaderValid,
            isDataValid: isDataValid,
            isSaveData : isSaveData
        }
    }

    res.status(statusCode).json({
        status: { code: statusCode, message: 'Success process', errors },
        data: {
            headers,
            genes: validations
        }
    });
};

const processFile = async (req, res = response) => {
    //1783(10%) => 178
    const minValueAllowed = 178;
    let statusCode = 200;
    let errors = null;
    const { content, headers, headersMap } = await readFile('|');
    const isHeaderValid = validateHeaders(headers);
    const { isDataValid, validations } = await validateContent(content);
    const isValidLength = minValueAllowed < validations.length;
    console.log(`data size::${ content.length }, rows allowed to validate::${ validations.length }, isValidMinLength::${ isValidLength }, header is valid::${ isHeaderValid }, data is valid::${ isDataValid }`);

    const isSaveData = isHeaderValid && isDataValid && isValidLength && await saveData( headersMap ,content );
    if ( !isSaveData ) {
        statusCode = 400;
        errors = {
            isValidMinLength: isValidLength,
            isHeaderValid: isHeaderValid,
            isDataValid: isDataValid,
            isSaveData : isSaveData
        }
    }

    res.status(statusCode).json({
        status: { code: statusCode, message: 'Success process', errors },
        data: {
            headers,
            genes: validations
        }
    });
};

//utils
const readFile = async ( separator = ',' ) => {
    const result = {};
    const path_file = path.join(__dirname, '../uploads/', 'data.csv');
    try {
        // read contents of the file
        const data = fs.readFileSync(path_file, 'UTF-8');
    
        // split the contents by new line
        const lines = data.split(/\r?\n/);
    
        // print all lines
        let headerMap = new Map();
        let headerValues = [];
        let values = [];
        lines.forEach((line, i) => {
            if(i > 0 && i < 10) {
                const [_key, _value] = line.substring(7).split(separator);
                headerValues.push({key:_key, value: _value});
                headerMap.set(_key, _value);
            }
            if(i > 10) {
                const [ CATEGORY, SUBCATEGORY, SUBSUBSUBCATEGORY, VOIDCOL, CATID, CUSTOM, GeneID, GeneName, Value ] = line.split(separator);
                const row = {
                    Category:CATEGORY,
                    SubCategory: SUBCATEGORY,
                    SubSubCategory: SUBSUBSUBCATEGORY,
                    voidCol: VOIDCOL,
                    CAT_ID: CATID,
                    Custom: CUSTOM,
                    Gene_ID: GeneID,
                    Gene_Name: GeneName,
                    VALUE: Value
                }
                !(Value == "" || Value == "--") && values.push(row);
            }
        });
        result.headersMap = headerMap;
        result.headers = headerValues;
        result.content = values;
        console.log("HashMap => ", headerMap);
        console.log("ROW => ", values[199]);
    } catch (err) {
        console.error(err);
    }
    return result;
}

const _readFile = async ( separator = ',' , _path ) => {
    const result = {};
    const path_file = path.join(_path);
    try {
        // read contents of the file
        const data = fs.readFileSync(path_file, 'UTF-8');
    
        // split the contents by new line
        const lines = data.split(/\r?\n/);
    
        // print all lines
        let headerMap = new Map();
        let headerValues = [];
        let values = [];
        lines.forEach((line, i) => {
            if(i > 0 && i < 10) {
                const [_key, _value] = line.substring(7).split(separator);
                headerValues.push({key:_key, value: _value});
                headerMap.set(_key, _value);
            }
            if(i > 10) {
                const [ CATEGORY, SUBCATEGORY, SUBSUBSUBCATEGORY, VOIDCOL, CATID, CUSTOM, GeneID, GeneName, Value ] = line.split(separator);
                const row = {
                    Category:CATEGORY,
                    SubCategory: SUBCATEGORY,
                    SubSubCategory: SUBSUBSUBCATEGORY,
                    voidCol: VOIDCOL,
                    CAT_ID: CATID,
                    Custom: CUSTOM,
                    Gene_ID: GeneID,
                    Gene_Name: GeneName,
                    VALUE: Value
                }
                !(Value == "" || Value == "--") && values.push(row);
            }
        });
        result.headersMap = headerMap;
        result.headers = headerValues;
        result.content = values;
        console.log("HashMap => ", headerMap);
        console.log("ROW => ", values[199]);
    } catch (err) {
        console.error(err);
    }
    return result;
}

const validateHeaders = headers  => {
    let retVal = null;
    headers.map( header => {
        const { key, value } = header;
        retVal = value && value !== "";
        console.log(` key : ${key} value: ${value} => isValid: ${retVal}`);
        return retVal;
    }); 
    return retVal;
}
const validateContent = async content => {
    let isDataValid = null;
    const validations = await Promise.all(content.map( async rule => {
        const { Gene_ID, Gene_Name, VALUE } = rule;
        const resulset = await pool.query('SELECT * FROM genes.genome_taxonomy WHERE gene_id = $1', [Gene_ID]);
        let _isValid = null;
        let _message = null;
        let _scale = null;
        if (resulset.rowCount) {
            const [result] = resulset.rows;
            const { gene_scale } = result;
             _scale = gene_scale;
            let { _result, message } = doValidation(Gene_ID, VALUE, gene_scale);
            _isValid = _result;
            isDataValid = _result;
            _message = message;
            isDataValid = !_result && false
            //!isDataValid && console.log(`gene_id ${ Gene_ID } => ${isDataValid}`);
        } else {
            console.log('rule no encontrado => ', rule);
        }
        
        return {
            Gene_ID,
            gene_scale: _scale,
            Gene_Name,
            VALUE,
            isValid: _isValid,
            message: _message
        }
    }));

    return { isDataValid, validations };
}
const doValidation = (id, value, __scale) => {
    let range_char = "–";
    let scale = __scale.trim();
    let retVal = false;
    let rejectionReasonMsg = null;
    let validations = scale.split(',');
    validations.length > 1 && console.log(`init rule ${id} --> scale --> ${scale} size --> ${ validations.length }`);
    if(validations.length > 1) {//BLOCK_1 :: it's asume that value is a number or a range
        //console.log(`   BLOCK_1:: n reglas --> ${JSON.stringify( validations )} `);
        validations.map( _scale_ => {
            let _scale = _scale_.trim();
            if (isNaN(_scale) && _scale.split(range_char).length > 1) {
                const [x, y] = _scale.split(range_char);
                //console.log(`       x => ${x} , y => ${y}`);
                retVal = (value >= x && value <= y);
                //console.log(`       BLOCK_1::SUB_BLOCK_A:: Es-rango --> ${ _scale } ---> ${value} >= x:${x} && y:${value} <= ${y}  retval => ${ retVal } `);
                if(!retVal && !isNaN(value)) {
                    //console.log('           *MSG Fuera de rango numerico');
                }
                if(!retVal && isNaN(value)){
                    //console.log(`           *MSG El valor no es un numero => el tipo es: ${typeof(value)}`);
                }
                if(!retVal){
                    //console.log(`           *MSG Motivo desconocido => valor: ${value}`);
                }
            } else {
                retVal = value == _scale
                //console.error(`     BLOCK_1::SUB_BLOCK_B:: ---> value:${value} == scale:${_scale} retval => ${retVal}`);
            }
        });
    } else {//2_BLOCK::validate if type of value
        //console.log(`   BLOCK_2:: 1 regla --> ${ scale } `);
        if(isNaN(scale) && scale == "Text box") {
            retVal = (value != "")
            //console.log(`       BLOCK_2::SUB_BLOCK_A:: (Text box) --> ${ scale } --- retval => ${ retVal } `);
        } else if (isNaN(scale) && scale.includes(range_char)) {
            const [x, y] = scale.split(range_char);
            //console.log(`       BLOCK_2::SUB_BLOCK_B:: x => ${x} , y => ${y}`);
            retVal = (value >= x && value <= y) || false
            //console.log(`       Es-rango --> ${ scale } ---> ${value} >= ${x} && ${value} <= ${y}  retval => ${ retVal } `);
            if(!retVal && !isNaN(value)) {
                rejectionReasonMsg = `Value should be a number but value is out of range, the type is :: ${typeof(value)}`;
                //console.log('           * Fuera de rango numerico');
            }
            if(!retVal && isNaN(value)){
                rejectionReasonMsg = `Value should be a text, the tyoe is :: ${typeof(value)}`;
                //console.log(`           * El valor no es un numero => el tipo es: ${typeof(value)}`);
            }
            if(!retVal){
                rejectionReasonMsg = `Reason is unknown, value is :: ${value} and type is :: ${typeof(value)}`;
                //console.log(`           * Motivo desconocido => valor: ${value} y el tipo es :: ${typeof(value)}`);
            }
        } else if (isNaN(scale)) {
            //console.log('       BLOCK_2::SUB_BLOCK_C::');    
        } else {
            retVal = value == scale || false
            if(!retVal) {
                rejectionReasonMsg = `Value should be equal to scale :: value:${value} != scale: ${scale}`;
                //console.log(`           * valor no son iguales => valor:${value} != scale: ${scale}`);
            }
            //console.log(`       BLOCK_2::SUB_BLOCK_D:: Es numero --> ${ scale } --- retval => ${ retVal } `);
        }
    }
    //console.log(`final rule ${id} --> scale --> ${scale} ---> value --->  ${value} ---> is-valid => ${retVal}`);
    //validations.length > 1 && console.log('');
    //validations.length > 1 && console.log('');
    return {_result:retVal, message: rejectionReasonMsg};
}
const saveData = async ( headerFile, dataFile ) => {
    let isSaved = null;
    try {
        //Manual validation
        let queryString = '';
        let valuestHeader = null;
        const resulset = await pool.query('SELECT * FROM genes.movie_code_header WHERE imdb_id = $1', [headerFile.get('imdb_id')]);
        if (resulset.rowCount) {
            queryUpdateHeader = 'UPDATE genes.movie_code_header SET user_id = $1, user_name = $2, version_current = $3 WHERE imdb_id = $4 RETURNING *';
            queryUpdateData = 'UPDATE genes.movie_genes_coding SET is_active = $1 WHERE imdb_id = $2 RETURNING *';
            valuesUpdateHeader = [headerFile.get('user_id'), headerFile.get('user_name'), `${headerFile.get('version_current')} v${resulset.rowCount + 1}`, headerFile.get('imdb_id')];
            valuesUpdateData = ['false', headerFile.get('imdb_id')];
            const resulsetUpdateHeader = await pool.query(queryUpdateHeader, valuesUpdateHeader);
            const resulsetUpdateData = await pool.query(queryUpdateData, valuesUpdateData);
            console.log(`UPDATE HEADER RESULTSET: ${resulsetUpdateHeader.rows[0]}`);
            console.log(`UPDATE DATA RESULTSET COUNT: ${resulsetUpdateData.rowCount}`);
        } else {
            queryString = 'INSERT INTO genes.movie_code_header (movie_title, imdb_id, release_year, version_current, version_original, user_id, user_name, reviewer_id, reviewer_name) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *';
            valuestHeader = [headerFile.get('MOVIE TITLE'), headerFile.get('imdb_id'), headerFile.get('release_year'), `${headerFile.get('version_current')} v1`, headerFile.get('version_original'), headerFile.get('user_id'), headerFile.get('user_name'), headerFile.get('reviewer_id'), headerFile.get('reviewer_name')];
            const resulsetHeader = await pool.query(queryString, valuestHeader);
            console.log(`INSERTED Header: ${resulsetHeader.rows[0]}`);
        }

        const insertData = 'INSERT INTO genes.movie_genes_coding (gene_id, imdb_id, category, sub_category, sub_subcategory, cat_id, custom, gene_name, gene_value, user_id, is_active) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *';
    
        if(dataFile.length) {
            dataFile.map( async (item, index) => {
               if( item ) {
                let {
                    Category,
                    SubCategory,
                    SubSubCategory,
                    voidCol,
                    CAT_ID,
                    Custom,
                    Gene_ID,
                    Gene_Name,
                    VALUE
                } = item;
                Custom = true;
                const valuesData = [Gene_ID, headerFile.get('imdb_id'), Category, SubCategory, SubSubCategory, CAT_ID, Custom, Gene_Name, VALUE, headerFile.get('user_id'), true];
                Gene_ID && await pool.query(insertData, valuesData);
               }
            });
        }
        isSaved = true;
    } catch (error) {
        isSaved = false;
        console.log('Error in saveData funtion:: file controller ', error);
    }
    return isSaved;
}
module.exports = {
    uploadFiles,
    processFile
}