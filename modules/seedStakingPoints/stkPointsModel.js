const mongoose = require('mongoose');

const { Schema } = mongoose;

const stkPointsSchema = new Schema(
  {
    totalUsers: {
      type: Number,
      default: 0,
    },
    totalStkPointsDist : {
        type : Number,
        default : 0
    },
    stkPointsDist : {
        type : Number,
        default : 0
    },
    noOfUserGotStk : {
        type : Number,
        default : 0
    },
  },
  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model('stkpoints', stkPointsSchema);
