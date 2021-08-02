const ExcelJS = require('exceljs');
const excelColumnName = require('excel-column-name');
const { pool } = require('../database/connect');

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
  const sheetErrors = [];
  const requiredSheets = [1];
  const sheetNotFound = requiredSheets.find((s) => !hasWorkSheet(workbook, s));
  if (sheetNotFound) throw new Error(`Sheet not found: ${sheetNotFound}`);

  // validate columns by sheets
  const [dataItems] = await Promise.all([getTableData(workbook, 1)])

  


/*
  const columsItem = [
    "name",
    "sku",
    "description",
    "category",
    "sub_category",
    "price",
    "is_sale",
    "sale_price",
    "sale_text",
    "calories",
    "is_veg",
    "image",
    "thumbnail",
    "active",
    "stock",
  ];

  const { errors: itemsErrors } = validateRequiredColumns(
    dataItems,
    columsItem
  )


  if (itemsErrors) {
    sheetErrors.push({
      sheetName: "items",
      errors: itemsErrors,
    });
  }

  if (sheetErrors.length > 0)
    throw new Error(
      `Validation fail on checking columns => errors: ${sheetErrors}`
    )
  */
  return {
    dataItems
  }
}
const processExcelFile = async (filePath) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const { dataItems } = await extractDataFromWorkbook(workbook);

    if (isNonSpaceFormat(dataItems, ["Category"])) {
      validateDataNonSpaceFormat(dataItems);
    } else {
      validateDataSpaceFormat(dataItems);
    }
    const columsItemCodingTable = [
      "Category",
      "Sub-Category",
      "Sub-Sub-Category",
      "GENE ID",
      "GENE NAME",
      "SCALE",
      "SCORING",
    ];

    const columsItemHeaderTable = [
      "MOVIE TITLE",
      "imdb_id",
      "release_year",
      "coder_name",
    ];
  } catch (error) {
    //console.log(error)
  }

  return true;
};
const sendDataToDB = async ( headerFile, dataFile ) => {
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
          //console.log(`UPDATE HEADER RESULTSET: ${resulsetUpdateHeader.rows[0]}`);
          //console.log(`UPDATE DATA RESULTSET COUNT: ${resulsetUpdateData.rowCount}`);
      } else {
          queryString = 'INSERT INTO genes.movie_code_header (movie_title, imdb_id, release_year, version_current, version_original, user_id, user_name, reviewer_id, reviewer_name) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *';
          valuestHeader = [headerFile.get('MOVIE TITLE'), headerFile.get('imdb_id'), headerFile.get('release_year'), `${headerFile.get('version_current')} v1`, headerFile.get('version_original'), headerFile.get('user_id'), headerFile.get('user_name'), headerFile.get('reviewer_id'), headerFile.get('reviewer_name')];
          const resulsetHeader = await pool.query(queryString, valuestHeader);
          //console.log(`INSERTED Header: ${resulsetHeader.rows[0]}`);
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
      //console.log('Error in saveData funtion:: file controller ', error);
  }
  return isSaved;
}

const validateDataNonSpaceFormat = async data => {
  console.log(`files::validateDataNonSpaceFormat`)
  data.forEach((element, idx) => {
    const [,Category, Sub_Category, Sub_Sub_Category, GENE_ID, GENE_NAME, SCALE, SCORING ] = element.toString().split(',');
    const [,,, key, value ] = element.toString().split(',');
    //headers
    if(idx === 0 ) {
      if(!key || key !== 'MOVIE TITLE') throw new Error('Error in Header => MOVIE TITLE')
      if(!value) throw new Error('Error in value of Header MOVIE TITLE')
    }
    if(idx === 1 ) {
      if(!key || key !== 'imdb_id') throw new Error('Error in Header => imdb_id')
      if(!value) throw new Error('Error in value of Header imdb_id')
    }
    if(idx === 2 ) {
      if(!key || key !== 'release_year') throw new Error('Error in Header => release_year')
    }
    if(idx === 3 ) {
      if(!key || key !== 'coder_name') throw new Error('Error in Header => coder_name')
    }

    //headers row
    if(idx === 6 ) { 
      console.log(`Validate Headers => ${Category}, ${Sub_Category}, ${Sub_Sub_Category}, ${GENE_ID} ${GENE_NAME}, ${SCALE}, ${SCORING}`)
    }

    //data
    if(idx > 6 ) { 
      //console.log(`Validate data => ${Category}, ${Sub_Category}, ${Sub_Sub_Category}, ${GENE_ID} ${GENE_NAME}, ${SCALE}, ${SCORING}`)
    }
  })
}

const validateDataSpaceFormat = async data => {
  data.forEach((element, idx) => {
    const [,, Category, Sub_Category, Sub_Sub_Category, GENE_ID, GENE_NAME, SCALE, SCORING ] = element.toString().split(',');
    const [,,,, key, value ] = element.toString().split(',');
    //headers
    if(idx === 1 ) {
      if(!key || key !== 'MOVIE TITLE') throw new Error('Error in Header => MOVIE TITLE')
      if(!value) throw new Error('Error in value of Header MOVIE TITLE')
    }
    if(idx === 2 ) {
      if(!key || key !== 'imdb_id') throw new Error('Error in Header => imdb_id')
      if(!value) throw new Error('Error in value of Header imdb_id')
    }
    if(idx === 3 ) {
      if(!key || key !== 'release_year') throw new Error('Error in Header => release_year')
    }
    if(idx === 4 ) {
      if(!key || key !== 'coder_name') throw new Error('Error in Header => coder_name')
    }
    
    //headers row
    if(idx === 7 ) { 
      console.log(`Validate Headers => ${Category}, ${Sub_Category}, ${Sub_Sub_Category}, ${GENE_ID} ${GENE_NAME}, ${SCALE}, ${SCORING}`)
    }

    //data row
    if(idx > 8 ) { 
      //console.log(`Validate data => ${Category}, ${Sub_Category}, ${Sub_Sub_Category}, ${GENE_ID} ${GENE_NAME}, ${SCALE}, ${SCORING}`)
    }
  })
}
 
const isNonSpaceFormat = (data, requiredColumns = []) => {
  const headers = data[6];
  return !!headers;
}

module.exports = {
    processExcelFile,
    sendDataToDB
}