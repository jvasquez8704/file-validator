const { response } = require('express');
const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
const { pool } = require('../database/connect');
const results = [];

const uploadFiles =  async (req, res = response) => {
    console.log('Files ', req.files);
    let sampleFile;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0 || !req.files.sampleFile) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    sampleFile = req.files.sampleFile;
    // uploadPath = __dirname + '/files/' + sampleFile.name;
    uploadPath = path.join(__dirname,  '../uploads/' , sampleFile.name);
    console.log('path => ', uploadPath);
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function(err) {
        if (err)
        return res.status(500).send(err);

        res.send('File uploaded!');
    });
};

const readCsvFile = async (req, res = response) => {
    const path_file = path.join(__dirname, '../uploads/', 'test_data.csv');
    let i = 0;
    fs.createReadStream(path_file)
    .pipe(csv({delimiter: ':'}))
    .on('data', (data) => {
        (i <= 20) && console.log(`row ${i} =>`,data);
        i++;
        results.push(data);
    })
    .on('end', () => {
        console.log('Archivo procesado!!!');
        //console.log(results);
        // [
        //   { NAME: 'Daffy Duck', AGE: '24' },
        //   { NAME: 'Bugs Bunny', AGE: '22' }
        // ]
    });
    await readFile();
    
    res.json({
        ok: true,
        data: true,
        // token
    });
};

const processFile = async (req, res = response) => {
    const parseData = await readFile();
    res.json({
        status: {code: 200, message: 'File Process Success'},
        data: parseData,
        // token
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
                const [ CATEGORY, SUBCATEGORY, SUBSUBSUBCATEGORY, VOIDCOL, CATID, CUSTOM, GeneID, GeneName ] = line.split(',');
                const row = {
                    Category:CATEGORY,
                    SubCategory: SUBCATEGORY,
                    SubSubCategory: SUBSUBSUBCATEGORY,
                    voidCol: VOIDCOL,
                    CAT_ID: CATID,
                    Custom: CUSTOM,
                    Gene_ID: GeneID,
                    Gene_Name: GeneName,
                }
                values.push(row);
            }
        });
        result.headers = headerValues;
        result.content = values;
        console.log("HashMap => ", headerMap);
        console.log("ROW => ", values[1500]);
    } catch (err) {
        console.error(err);
    }
    return result;
}
module.exports = {
    uploadFiles,
    processFile
}