//requiring path and fs modules
const path = require('path')
const fs = require('fs')

const { processExcelFile } = require('./util/files')
//joining path of directory 
const directoryPath = path.join(__dirname, 'documents')
//passsing directoryPath and callback function
fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        throw new Error('Unable to scan directory: ' + err)
    } 
    //listing all files using forEach
    files.forEach(async (file) => {
        console.log(`file => ${file}`)
        const filePath = path.join(directoryPath, file)
        await processExcelFile(filePath)
        // Do whatever you want to do with the f
    })
})     


 //list files
console.log(`a webo!!!`)