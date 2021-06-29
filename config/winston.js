const momentTz = require('moment-timezone');
const { createLogger, format, transports } = require('winston');

const { combine, timestamp, prettyPrint } = format;
require('winston-daily-rotate-file');

const transport = new transports.DailyRotateFile({
  filename: 'logger',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20g',
  maxFiles: '14d',
  dirname: '../logs',
  localTime: true,
});

const getTimeStamp = () =>
  momentTz.tz(new Date(), process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss');

const logger = createLogger({
  format: combine(
    timestamp({
      format: getTimeStamp,
    }),
    prettyPrint()
  ),
  transports: [transport],
});

global.winston = logger;
