const mongoose = require('mongoose');

const { Schema } = mongoose;

const claimSchema = new Schema(
  {
    tokenAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    networkName: {
      type: String,
      required: true,
      enum: ['polygon', 'binance', 'ethereum'],
      lowercase: true,
    },
    networkSymbol: {
      type: String,
      required: true,
      enum: ['BNB', 'ETH', 'MATIC'],
    },
    networkId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model('claim', claimSchema);
