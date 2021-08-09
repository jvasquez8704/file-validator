const ExcelJS = require('exceljs');
const _ = require('lodash');
const excelColumnName = require('excel-column-name');
const { pool } = require('../database/connect');
const path = require('path')

const directoryPath = path.join(__dirname, '../documents')

const validateRequiredColumns = (data, startRow,requiredColumns = []) => {
  const headers = data[startRow];
  const notFound = [];
  requiredColumns.forEach((c) => {
    if (!headers.find((h) => c === h)) {
      notFound.push(c);
    }
  });

  if (notFound.length) {
    return {
      missingColumns: notFound.length,
      errors: notFound.map((c) => `Column ${c} is required`),
    };
  }
  return false;
}
const getCellPairs = (cell) => [
  cell.match(/([A-Z]*)/g)[0],
  cell.replace(cell.match(/([A-Z]*)/g)[0] || "", ""),
]
const getRows = (ws) => {
  const rows = [];
  ws.eachRow((row, rowNumber) => {
    const values = row.values.map((value) =>
      value.formula || value.sharedFormula ? value.result : value
    );
    rows[rowNumber - 1] = values;
  });
  return rows;
}
const getTableData = async (wb, wsName, autoFilter = true) => {
  const ws = wb.getWorksheet(wsName);
  if (!ws)
    throw new Error(
      `Sheet not found: ${wsName}`
    )

  const rows = getRows(ws);

  if (!ws.autoFilter || !autoFilter) return rows;
  const af = ws.autoFilter.split(":").map((cell) => getCellPairs(cell));
  let result = rows.slice();

  if (af) {
    if (af[0][1]) {
      const startRow = parseInt(af[0][1], 10);
      result = result.slice(startRow - 1);
    }

    if (af[0][0] && af[1][0]) {
      const startColumn = excelColumnName.excelColToInt(af[0][0]);
      const endColumn = excelColumnName.excelColToInt(af[1][0]);
      return result.map((row) => row.slice(startColumn - 1, endColumn - 1));
    }
  }

  return result;
}
const hasWorkSheet = (wb, sheet) => !!wb.getWorksheet(sheet)
const extractDataFromWorkbook = async (workbook) => {
  // validate sheets
  const requiredSheets = [1];
  const sheetNotFound = requiredSheets.find((s) => !hasWorkSheet(workbook, s));
  if (sheetNotFound) throw new Error(`Sheet not found: ${sheetNotFound}`);

  // validate columns by sheets
  const [dataItems] = await Promise.all([getTableData(workbook, 1)])
  
  return {
    dataItems
  }
}
const processExcelFile = async (filePath, nameFile) => {
  let report = {};
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const { dataItems } = await extractDataFromWorkbook(workbook);

    if (isNonSpaceFormat(dataItems, ["Category"])) {
      report = await validateData(nameFile, dataItems, 6, 0, 3);
    } else {
      // agregar validación si no es ninguno de estos 2 formatos
      report = await validateData(nameFile ,dataItems, 7, 1, 4);
    }

  } catch (error) {
    console.error(error)
    report.nameFile = nameFile
    report.error = error
  }
  return report;
};
const sendDataToDB = async ( headerFile, dataFile ) => {
  let isSaved = null;
  console.log(headerFile);
  try {
      //Manual validation
      let queryString = '';
      let valuestHeader = null;
      const resulset = await pool.query('SELECT * FROM public.movie_code_header WHERE imdb_id = $1', [headerFile.get('imdb_id')]);
      if (resulset.rowCount) {
          queryUpdateHeader = 'UPDATE public.movie_code_header SET release_year = $1, coder_name = $2 WHERE imdb_id = $3 RETURNING *';
          queryUpdateData = 'UPDATE public.movie_genes_coding SET is_active = $1 WHERE imdb_id = $2 RETURNING *';
          valuesUpdateHeader = [headerFile.get('release_year'), headerFile.get('coder_name'), headerFile.get('imdb_id')];
          valuesUpdateData = ['false', headerFile.get('imdb_id')];
          await pool.query(queryUpdateHeader, valuesUpdateHeader);
          await pool.query(queryUpdateData, valuesUpdateData);
      } else {
          queryString = 'INSERT INTO public.movie_code_header (movie_title, imdb_id, release_year, coder_name) VALUES($1, $2, $3, $4) RETURNING *';
          valuestHeader = [headerFile.get('MOVIE TITLE'), headerFile.get('imdb_id'), headerFile.get('release_year'), headerFile.get('coder_name')];
          await pool.query(queryString, valuestHeader);
      }

      const insertData = 'INSERT INTO public.movie_genes_coding (gene_id, imdb_id, category, sub_category, sub_subcategory, gene_name, gene_scale, scoring, is_active) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *';
      if(dataFile.length) {
          dataFile.map( async (item, index) => {
             if( item ) {
              let { category, sub_category, sub_sub_category, gene_id, gene_name, scale, scoring }  = item;
              const valuesData = [gene_id, headerFile.get('imdb_id'), category, sub_category, sub_sub_category, gene_name, scale, scoring, true];
              await pool.query(insertData, valuesData);
             }
          })
      }
      isSaved = true;
  } catch (error) {
      isSaved = false;
      
      console.log(error);
  }
  return isSaved;
}
const mapRows = (dataRows, headerRowIndex, headerLowimit, headerMaxLimit) => {
  const colNames = dataRows[headerRowIndex].filter( col => col !== null);
  const headers = [];
  for (let i = headerLowimit; i <= headerMaxLimit; i++) {
     headers.push(dataRows[i])    
  }

  const offsetCol = headerLowimit ? 2 : 1;
  const items = dataRows.slice(headerRowIndex + 1).map((row) => {
    const rowData = {};
    colNames.forEach((key, index) => {
      if (key && key !== '') {
        if (row[index + offsetCol] && row[index + offsetCol] !== '') {
          rowData[_.snakeCase(key)] = row[index + offsetCol]
        }else{
          rowData[_.snakeCase(key)] = '';
        }
      }
    })
    return rowData;
  })
  return {
    items,
    colNames,
    headers
  }
}
const validateData = (name, data, headerRowIndex, headerLowimit, headerMaxLimit) => {
  const { items, colNames, headers } = mapRows(data, headerRowIndex, headerLowimit, headerMaxLimit);
  let report = {
    nameFile: name,
    data: items,
    headers
  }
  let headerErrors = [];
  let columnsErrors = [];
  const mapHeaders = new Map();

  //Validate Headers
  headers.forEach( async (row, idx) => {
    const header = row.toString().split(",");
    const key = !headerLowimit ? header[3] : header[4];
    const value = !headerLowimit ? header[4] : header[5];
    mapHeaders.set(key, value);
    if (idx === 0) {
      if (!key || key.toUpperCase() !== "MOVIE TITLE") headerErrors.push('Error in Header => MOVIE TITLE')
      if (!value) headerErrors.push("Error in value of Header MOVIE TITLE")
    }
    if (idx === 1) {
      if (!key || key.toUpperCase() !== "IMDB_ID") headerErrors.push("Error in Header => imdb_id")
      if (!value) headerErrors.push("Error in value of Header imdb_id")
    }
    if (idx === 2) {
      if (!key || key.toUpperCase() !== "RELEASE_YEAR") headerErrors.push("Error in Header => release_year")
    }
    if (idx === 3) {
      if (!key || key.toUpperCase() !== "CODER_NAME") headerErrors.push("Error in Header => coder_name")
    }
  })
  if(headerErrors.length) report.headerErrors = headerErrors;

  //Validate Column names
  if(!colNames.includes('Category')) columnsErrors.push("Error in column:: Category")
  if(!colNames.includes('Sub-Category')) columnsErrors.push("Error in column:: Sub-Category")
  if(!colNames.includes('Sub-Sub-Category')) columnsErrors.push("Error in column:: Sub-Sub-Category")
  if(!colNames.includes('GENE ID')) columnsErrors.push("Error in column:: GENE ID")
  if(!colNames.includes('GENE NAME')) columnsErrors.push("Error in column:: GENE NAME")
  if(!colNames.includes('SCALE')) columnsErrors.push("Error in column:: SCALE")
  if(!colNames.includes('SCORING')) columnsErrors.push("Error in column:: SCORING")
  if(columnsErrors.length) report.columnsErrors = columnsErrors;
  report.headers = mapHeaders;

  // const { Category, Sub_Category, Sub_Sub_Category, GENE_ID, GENE_NAME, SCALE, SCORING } = colNames.toString().split(',');
  // console.log(`Validate Headers => ${Category}, ${Sub_Category}, ${Sub_Sub_Category}, ${GENE_ID} ${GENE_NAME}, ${SCALE}, ${SCORING}`)
  return report
}
 
const isNonSpaceFormat = (data, requiredColumns = []) => {
  const headers = data[6];
  return !!headers;
}

module.exports = {
    processExcelFile,
    sendDataToDB
}