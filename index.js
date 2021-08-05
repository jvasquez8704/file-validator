//requiring path and fs modules
const path = require('path')
const fs = require('fs')

const { processExcelFile, sendDataToDB } = require('./util/files')
//joining path of directory 
const directoryPath = path.join(__dirname, 'documents')
//passsing directoryPath and callback function
let reports = [];
/*fs.readdir(directoryPath, function (err, files) {
    if (err) {
        throw new Error('Unable to scan directory: ' + err)
    } 
    files.forEach(async (file) => {
        const filePath = path.join(directoryPath, file)
        const report = await processExcelFile(filePath, file)
        reports.push(report)
    })
})*/   
const files = fs.readdirSync(directoryPath)
files.forEach(async (file) => {
    const filePath = path.join(directoryPath, file)
    const report = await processExcelFile(filePath, file)
    reports.push(report)
});

//sent to DB
reports.forEach(async (report) => {
    const { error, headerErrors, columnsErrors, headers, data } = report;
    if(!error && !headerErrors.length && !columnsErrors.length) { 
        await sendDataToDB(headers, data);
    }
});

 //list files
console.log(`Finish process!!!`)