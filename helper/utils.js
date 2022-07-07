const nodemailer = require('nodemailer');
const emailJson = require('./email.json');
const { google } = require('googleapis');
const Web3 = require('web3');
const solanaWeb3 = require('@solana/web3.js');
const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');
const settingHelper = require('../modules/settings/settingHelper');
const utils = {};

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLEINT_SECRET = process.env.GOOGLE_CLEINT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

utils.sendEmail = async (data, message, email) => {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLEINT_SECRET,
      REDIRECT_URI
    );
    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
    const accessToken = await oAuth2Client.getAccessToken();

    if (data.length) {
      const csv = new ObjectsToCsv(data);
      const fileName = +new Date();
      await csv.toDisk(`./csv/${fileName}.csv`);

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: 'snapshot@seedify.fund',
          clientId: CLIENT_ID,
          clientSecret: CLEINT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });

      let mailContent = {
        from: 'snapshot@seedify.fund',
        to: email,
        subject: message,
        text: message,
        attachments: [
          {
            filename: `${fileName}.csv`,
            path: `./csv/${fileName}.csv`,
          },
        ],
      };

      transporter.sendMail(mailContent, function (error, data) {
        if (error) {
          console.log('Unable to send mail', error);
        }
        if (data) {
          console.log('Email send successfully');
        }
      });
    } else {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: 'snapshot@seedify.fund',
          clientId: CLIENT_ID,
          clientSecret: CLEINT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });

      let mailContent = {
        from: 'snapshot@seedify.fund',
        to: email,
        subject: message,
        text: 'No transaction found for specified block number',
      };

      transporter.sendMail(mailContent, function (error, data) {
        if (error) {
          console.log('Unable to send mail', error);
        }
        if (data) {
          console.log('Email send successfully');
        }
      });
    }
  } catch (err) {
    console.log('error in catch', err);
  }
};

utils.echoLog = (...args) => {
  if (process.env.SHOW_LOG === 'true') {
    try {
      winston.info(args);
    } catch (e) {
      winston.log(e);
    }
  }
  // }
};

utils.empty = (mixedVar) => {
  let key;
  let i;
  let len;
  const emptyValues = ['undefined', null, false, 0, '', '0'];
  for (i = 0, len = emptyValues.length; i < len; i++) {
    if (mixedVar === emptyValues[i]) {
      return true;
    }
  }
  if (typeof mixedVar === 'object') {
    for (key in mixedVar) {
      return false;
    }
    return true;
  }

  return false;
};

utils.sendSmapshotEmail = async (
  location,
  fileName,
  subject,
  message,
  format
) => {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLEINT_SECRET,
      REDIRECT_URI
    );
    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'snapshot@seedify.fund',
        clientId: CLIENT_ID,
        clientSecret: CLEINT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    let snapshotEmail = await settingHelper.getSnapshotEmails();
    let ccEmail = await settingHelper.getccEmails();

    let mailContent = {
      from: 'snapshot@seedify.fund',
      to: snapshotEmail,
      subject: subject,
      text: message,
      cc: ccEmail,
      attachments: [
        {
          filename: `${fileName}.${format ? format : 'xlsx'}`,
          path: location,
        },
      ],
    };

    transporter.sendMail(mailContent, function (error, data) {
      if (error) {
        console.log('Unable to send mail', error);
      }
      if (data) {
        console.log('Email send successfully');
        // fs.unlink(location, ()=>{
        //   console.log(`remove ${location}`)
        // })
      }
    });
  } catch (err) {
    console.log('error in catch', err);
  }
};

utils.convertToEther = (number) => {
  if (number) {
    let value = parseFloat(Web3.utils.fromWei(number)).toFixed(5);

    return +value;
  } else {
    return 0;
  }
};

utils.toTruncFixed = (value, n) => {
  return toTrunc(value, n).toFixed(n);
};

function toTrunc(value, n) {
  x = (value.toString() + '.0').split('.');
  return parseFloat(x[0] + '.' + x[1].substr(0, n));
}

utils.checkAddressForSolana = async (address) => {
  try {
    const pubKey = new solanaWeb3.PublicKey(address);
    const checkisTrue = solanaWeb3.PublicKey.isOnCurve(pubKey);

    if (checkisTrue) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    return false;
  }
};

utils.sendFromalEmail = async (text, subject) => {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLEINT_SECRET,
      REDIRECT_URI
    );
    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'snapshot@seedify.fund',
        clientId: CLIENT_ID,
        clientSecret: CLEINT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });


    let snapshotEmail = await settingHelper.getSnapshotEmails();
    let ccEmail = await settingHelper.getccEmails();

    let mailContent = {
      from: 'snapshot@seedify.fund',
      to: snapshotEmail,
      subject: subject,
      text: text,
      cc: ccEmail,
    };

    transporter.sendMail(mailContent, function (error, data) {
      if (error) {
        console.log('Unable to send mail', error);
      }
      if (data) {
        console.log('Email send successfully');
      }
    });
  } catch (err) {}
};

module.exports = utils;
