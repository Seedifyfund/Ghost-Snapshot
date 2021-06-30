const mongoose = require('mongoose');
const { roles } = require('../../helper/enum');

const { Schema } = mongoose;

const lotterySchema = new Schema(
  {
    requestNo: {
      type: String,
      required: true,
    },
    walletAddress: {
      type: String,
      default: null,
    },
    lotteryNumbers: [
      {
        type: String,
      },
    ],

    lotteryUsers: {
      type: Number,
      default: 0,
    },

    totalRecords: {
      type: Number,
      default: 0,
    },

    noOfRecordsAdded: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model('lottery', lotterySchema);
