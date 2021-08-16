const xl = require('excel4node');

const genrateSpreadSheet = {};

genrateSpreadSheet.genrateExcel = async (users) => {
  const wb = new xl.Workbook();
  Object.keys(users).map((key, index) => {
    const ws = wb.addWorksheet(key);
    const value = users[key];
    const headingColumnNames = [];

    if (value.length) {
      Object.keys(value[0]).map((columns) => {
        headingColumnNames.push(columns);
      });
    }

    let headingColumnIndex = 1;
    headingColumnNames.forEach((heading) => {
      ws.cell(1, headingColumnIndex++).string(heading);
    });

    let rowIndex = 2;
    value.forEach((record) => {
      let columnIndex = 1;
      Object.keys(record).forEach((columnName) => {
        ws.cell(rowIndex, columnIndex++).string(record[columnName].toString());
      });
      rowIndex++;
    });
  });

  wb.write('users.xlsx');
};

module.exports = genrateSpreadSheet;
