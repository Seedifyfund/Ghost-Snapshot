const utils = require("./utils");

const error = {};

error.notFound = (res, req) => {
  utils.echoLog("Request is:", req);
  res.status(404).json("INVALID_REQUEST");
};

error.notAuthenticated = (res, req, data) => {
  const response = {};
  if (!utils.empty(data) && _.isObject(data)) {
    utils.echoLog(req);
    if (data) {
      for (const key in data) {
        response[key] = data[key];
      }
    }
  } else {
    response.message = "NOT_AUTHORIZED";
  }
  res.status(401).json(response);
};

error.validationError = (res, message) => res.status(400).json(message);

module.exports = error;
