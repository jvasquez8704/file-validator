//requiring path and fs modules
const path = require('path')
const fs = require('fs')
require('dotenv').config();

const { sendDataToDB, processExcelFile } = require('./util/files')
//joining path of directory 
const directoryPath = path.join(__dirname, 'documents')
let reports = [];
//passsing directoryPath and callback function

try {
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            throw new Error('Unable to scan directory: ' + err)
        } 
        files.forEach(async (file) => {
            if(path.extname(file) === ".xlsx") {
                const filePath = path.join(directoryPath, file)
                const report = await processExcelFile(filePath, file)
                //set 
                const { error, headerErrors, columnsErrors, headers, data } = report;
                if(!error && !headerErrors && !columnsErrors) { 
                    await sendDataToDB(headers, data)
                }
                reports.push(report)
            }
        })
        console.log({reports})
    }) 
} catch (error) {
    console.log(error)
}


//const files = fs.readdirSync(directoryPath)
// files.forEach(async (file) => {
//     if(path.extname(file) === ".xlsx") {
//         const filePath = path.join(directoryPath, file)
//         const report = await processExcelFile(filePath, file)
//         reports.push(report)
//     }    
// })
// getReports(files).then((reports) => {
    // console.log(reports)
    //sent to DB
    // reports.forEach(async (report) => {
    //     const { error, headerErrors, columnsErrors, headers, data } = report;
    //     if(!error && !headerErrors.length && !columnsErrors.length) { 
    //         await sendDataToDB(headers, data)
    //     }
    // })
// }).catch(console.error)

// try {
//     const reports = files.map(async (file) => {
//         if (path.extname(file) === ".xlsx") {
//           const filePath = path.join(directoryPath, file);
//           const report = await processExcelFile(filePath, file);
//           return report;
//         }
//       })
//      //list files
//     console.log(`Finish process!!! `, {reports})
    
// } catch (error) {
//     console.log(error)
// }