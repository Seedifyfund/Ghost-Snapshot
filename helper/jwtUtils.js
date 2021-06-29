const jwt = require("jsonwebtoken");

const jwtUtils = {};

jwtUtils.getAuthToken = (data) => jwt.sign(data, process.env.SECRET);

jwtUtils.decodeAuthToken = (token) => {
  if (token) {
    try {
      return jwt.decode(token, process.env.SECRET);
    } catch (error) {
      return false;
    }
  }
  return false;
};

module.exports = jwtUtils;
