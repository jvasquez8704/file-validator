const path = require('path');
const fs = require('fs');
const { pool } = require('./database/connect');

const validateHeaders = headers  => {
    console.log('validate headers => ', headers);
}
const validateContent = async conntent => {
    
  const { Gene_ID, Gene_Name, VALUE } = conntent[10];
  const _rule = getRule(Gene_ID);
//   const _rule = getRule(Gene_ID);
  console.log("row => ", conntent[10]);
  console.log("rule => ", _rule);

//   const validations = conntent.map( rule => {
//     const { Gene_ID, Gene_Name, VALUE } = rule;
//     const _rule = getRule(Gene_ID);
//     return {
//         Gene_ID,
//         isValid: doValidation(_rule),
//         Gene_Name,
//         VALUE
//     }
//   });
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

const doValidation = value => {
    let retVal = false;

    return retVal;
}

const processFile = async () => {
    const { content, headers } = await readFile();
    console.log('content size => ', content.length);
    validateHeaders(headers);
    await validateContent(content);
};

const readFile = async () => {
    const result = {};
    const path_file = path.join(__dirname, '/uploads/', 'data.csv');
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

processFile();
