const jwt = require("jsonwebtoken");

const jwtUtils = {};

jwtUtils.getAuthToken = (data) => jwt.sign(data, process.env.SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

jwtUtils.decodeAuthToken = (token) => {
  if (token) {

    try {
      return jwt.verify(token, process.env.SECRET);
    } catch (error) {
      return false;
    }
  }
  return false;
};

module.exports = jwtUtils;
