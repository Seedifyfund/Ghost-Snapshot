const nodemailer = require('nodemailer');
const emailJson = require('./email.json');
const { google } = require('googleapis');
const Web3 = require('web3');
const solanaWeb3 = require('@solana/web3.js');
const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');
const utils = {};

const CLIENT_ID =
  '160468034128-6kg7ono0ksjl35j850d8hdct1npk95iu.apps.googleusercontent.com';
const CLEINT_SECRET = 'm4Je9QFx45OuR3V0YnhAo-yL';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN =
  '1//04UvgkQSVetB2CgYIARAAGAQSNwF-L9Ir5l9OgU2eVkWMO1ZnJ-34xxh1lcpSCZdubTpiA2j04QErHrW2zXLc0pmS7cBULDHsiX8';

const snapshotEmail = [
  'cem@seedify.fund',
  'gsconsultantservices@gmail.com',
  'berk@seedify.fund',
  'serhat@seedify.fund',
  'apo@seedify.fund',
  'sungur@seedify.fund',
  'mariano@seedify.fund'
];
// const snapshotEmail = ['aziz.ansari@minddeft.com'];

const ccEmail = [
  'shantikumar@minddeft.com',
  'rishabh.katheria@minddeft.net',
  'krunal@minddeft.com',
  'aziz.ansari@minddeft.com',
  'abhishek.anand@minddeft.com',
  'suraj.chitroda@minddeft.com',
  'kamal.singh@minddeft.net',
  'bharat.kushwaha@minddeft.com',
];
// const ccEmail = ['aziz.ansari@minddeft.com'];

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
