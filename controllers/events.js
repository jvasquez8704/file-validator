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

const doValidation = (id, value, scale) => {
    let retVal = false;
    let validations = scale.split(',');
    if(validations.length > 1){
        //se asume que sera un numero o un rango
        validations.map( _scale => {
            if (isNaN(_scale) && _scale.split("-").length > 1) {
                const [x, y] = _scale.split("-");
                retVal = (value >= x && value <= y) || false
            } else {
                retVal = (value == scale) || false
            }
        });
    } else {
        //validar si es numero o texto
        //let [scale] = validations;
        if(isNaN(scale) && scale == "Text box") {
            retVal = (value != "") || false
        } else if (isNaN(scale) && scale.split("-").length > 1) {
            const [x, y] = scale.split("-");
            retVal = (value >= x && value <= y) || false
             
        } else {
            retVal = (value == scale) || false
        }
    }
    console.log(`rule ${id} -------> scale -----> ${scale}  value =>  ${value} -------------------------> prueba => ${retVal}`);
    return retVal;
}

const processFile = async (req, res = response) => {
    const { content, headers } = await readFile();
    console.log('content size => ', content.length);
    validateHeaders(headers);
    //validateContent(content);
    const validations = await Promise.all(content.map( async rule => {
        const { Gene_ID, Gene_Name, VALUE } = rule;
        const resulset = await pool.query('SELECT * FROM genome_taxonomy WHERE gene_id = $1', [Gene_ID]);
        let _isValid = null;
        let _scale = null;
        if (resulset.rowCount) {
            const [result] = resulset.rows;
            const { gene_scale } = result;
             _scale = gene_scale;
            _isValid = doValidation(Gene_ID ,VALUE, gene_scale)
        }else{
            console.log('rule no encontrado => ', Gene_ID);
        }
        
        return {
            Gene_ID,
            isValid: _isValid,
            Gene_Name,
            VALUE,
            gene_scale: _scale
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
                Value !== "" && values.push(row);
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