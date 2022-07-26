const AdminModel = require('./adminModel');
const bcrypt = require('bcryptjs');
const jwtUtil = require('../../helper/jwtUtils');
const Utils = require('../../helper/utils');
const asyncRedis = require('async-redis');

const client = asyncRedis.createClient();
const AdminCtr = {};

// add new user as admin
AdminCtr.addNewAdmin = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // const fetchRole = await RoleModel.findOne({ roleName: "ADMIN" });

    const AddNewAdmin = new AdminModel({
      email,
      username,
      password: bcrypt.hashSync(password, 10),
      // role: fetchRole._id,
    });

    await AddNewAdmin.save();

    return res.status(200).json({
      message: 'ADMIN_ADDED_SUCCESSFULLY',
      status: true,
    });
  } catch (err) {
    Utils.echoLog('error in creating user ', err);
    return res.status(500).json({
      message: 'Something Went wrong',
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// login user
AdminCtr.login = async (req, res) => {
  try {
    const query = {};

    if (req.body.email) {
      query.email = req.body.email;
    }
    if (req.body.username) {
      query.username = req.body.username;
    }

    const MAX_LOCK_PERIOD = 60 * 60 * 12; // 12 hours lock time
    const MAX_USER_ATTEMPTS = 5;

    const fetchUser = await AdminModel.findOne(query);

    if (fetchUser) {
      let userAttemts = await client.get(fetchUser.username);
      userAttemts = userAttemts ? userAttemts : 0;
      console.log(`${fetchUser.username} has previously ${userAttemts} failed attempts.`);
      if(MAX_USER_ATTEMPTS<=userAttemts){
        return res.status(429).json({status: false,message: "Too Many Attempts try it 12 hour later"});
      }
      if (bcrypt.compareSync(req.body.password, fetchUser.password)) {
        
        await client.del(fetchUser.username);
        
        const token = jwtUtil.getAuthToken({
          _id: fetchUser._id,
        });
        return res.status(200).json({
          message: 'SUCCESS',
          status: true,
          data: {
            token,
          },
        });
      } else {
        // userAttemts = parseInt(userAttemts)+1;
        console.log(typeof userAttemts)
        await client.set(fetchUser.username, ++userAttemts, "EX", MAX_LOCK_PERIOD)
        return res.status(400).json({
          message: 'Invalid username or password',
          status: false,
        });
      }
    } else {
      return res.status(400).json({
        message: 'Invalid username or password',
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog('error in login in admin  ', err);
    return res.status(500).json({
      message: 'DB_ERROR',
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = AdminCtr;
