const xl = require('excel4node');
const Utils = require('./utils');

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
  const timeStamp = +new Date();
  wb.write(`./lottery/users-${timeStamp}.xlsx`);

  Utils.sendSmapshotEmail(
    `./lottery/users-${timeStamp}.xlsx`,
    `users-${timeStamp}`,
    `snapshot for all tier at ${timeStamp} `,
    `snapshot  with file name ${`users-${timeStamp}.xlsx`}`,
    'xlsx'
  );
};

module.exports = genrateSpreadSheet;
