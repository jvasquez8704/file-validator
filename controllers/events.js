const { response } = require('express');
const path = require('path');
const fs = require('fs');
const { pool } = require('../database/connect');

const validateHeaders = headers  => {
    console.log('validate headers => ', headers);
}
const validateContent = async conntent => {

  const validations = conntent.map( rule => {
    const { Gene_ID, Gene_Name, VALUE } = rule;
    const _rule = getRule(Gene_ID);
    return {
        Gene_ID,
        isValid: doValidation(_rule),
        Gene_Name,
        VALUE
    }
   });
//   console.log('results => ', validations);
};

const getRule = async geneId => {
    const query = 'SELECT * FROM genome_taxonomy WHERE gene_id = $1';
    console.log('cartel de viejas ', query);
    const values = [geneId];

    const resultSet = await pool.query(query, values);

    if (!resultSet || !resultSet.rowCount) {
        throw new Error(`Error getting the rule => ${geneId} from DB`);
    }
    const [rule] = resultSet.rows;
    return rule;
}

const doValidation = (id, value, __scale) => {
    let range_char = "–";
    let scale = __scale.trim();
    let retVal = false;
    let rejectionReasonMsg = null;
    let validations = scale.split(',');
    validations.length > 1 && console.log(`init rule ${id} --> scale --> ${scale} size --> ${ validations.length }`);
    if(validations.length > 1) {//BLOCK_1
        console.log(`   BLOCK_1:: n reglas --> ${JSON.stringify( validations )} `);
        //se asume que sera un numero o un rango
        validations.map( _scale_ => {
            let _scale = _scale_.trim();
            if (isNaN(_scale) && _scale.split(range_char).length > 1) {
                const [x, y] = _scale.split(range_char);
                console.log(`       x => ${x} , y => ${y}`);
                retVal = (value >= x && value <= y);
                console.log(`       BLOCK_1::SUB_BLOCK_A:: Es-rango --> ${ _scale } ---> ${value} >= x:${x} && y:${value} <= ${y}  retval => ${ retVal } `);
                if(!retVal && !isNaN(value)) {
                    console.log('           *MSG Fuera de rango numerico');
                }
                if(!retVal && isNaN(value)){
                    console.log(`           *MSG El valor no es un numero => el tipo es: ${typeof(value)}`);
                }
                if(!retVal){
                    console.log(`           *MSG Motivo desconocido => valor: ${value}`);
                }
            } else {
                retVal = value == _scale
                console.error(`     BLOCK_1::SUB_BLOCK_B:: ---> value:${value} == scale:${_scale} retval => ${retVal}`);
            }
        });
    } else {//2_BLOCK
        //validar si es numero o texto
        //let [scale] = validations;
        console.log(`   BLOCK_2:: 1 regla --> ${ scale } `);
        if(isNaN(scale) && scale == "Text box") {
            retVal = (value != "")
            console.log(`       BLOCK_2::SUB_BLOCK_A:: (Text box) --> ${ scale } --- retval => ${ retVal } `);
        } else if (isNaN(scale) && scale.includes(range_char)) {
            const [x, y] = scale.split(range_char);
            console.log(`       BLOCK_2::SUB_BLOCK_B:: x => ${x} , y => ${y}`);
            retVal = (value >= x && value <= y) || false
            console.log(`       Es-rango --> ${ scale } ---> ${value} >= ${x} && ${value} <= ${y}  retval => ${ retVal } `);
            if(!retVal && !isNaN(value)) {
                rejectionReasonMsg = '           * Fuera de rango numerico';
                console.log(rejectionReasonMsg);
            }
            if(!retVal && isNaN(value)){
                rejectionReasonMsg = `           * El valor no es un numero => el tipo es: ${typeof(value)}`;
                console.log(rejectionReasonMsg);
            }
            if(!retVal){
                rejectionReasonMsg = `           * Motivo desconocido => valor: ${value}`;
                console.log(rejectionReasonMsg);
            }
        } else if (isNaN(scale)) {
            console.log('       BLOCK_2::SUB_BLOCK_C:: Otro ');    
        } else {
            retVal = value == scale || false
            if(!retVal) {
                rejectionReasonMsg = `           * valor no son iguales => valor:${value} != scale: ${scale}`;
                console.log(rejectionReasonMsg);
            }
            console.log(`       BLOCK_2::SUB_BLOCK_D:: Es numero --> ${ scale } --- retval => ${ retVal } `);
        }
    }
    console.log(`final rule ${id} --> scale --> ${scale} ---> value --->  ${value} ---> is-valid => ${retVal}`);
    validations.length > 1 && console.log('');
    validations.length > 1 && console.log('');
    return {_result:retVal, message: rejectionReasonMsg};
}

const processFile = async (req, res = response) => {
    const { content, headers } = await readFile();
    console.log('content size => ', content.length);
    validateHeaders(headers);
    //validateContent(content);
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
            _message = message;

        }else{
            console.log('rule no encontrado => ', Gene_ID);
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

    res.json({
        ok: true,
        data: validations
    });
};

const readFile = async () => {
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
                const [_key, _value] = line.substring(7).split(',');
                headerValues.push({key:_key, value: _value});
                headerMap.set(_key, _value);
            }
            if(i > 10) {
                const [ CATEGORY, SUBCATEGORY, SUBSUBSUBCATEGORY, VOIDCOL, CATID, CUSTOM, GeneID, GeneName, Value ] = line.split(',');
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
        result.headers = headerValues;
        result.content = values;
        console.log("HashMap => ", headerMap);
        console.log("ROW => ", values[499]);
    } catch (err) {
        console.error(err);
    }
    return result;
}




module.exports = {
    processFile
}