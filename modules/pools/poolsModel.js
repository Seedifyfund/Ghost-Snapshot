const mongoose = require('mongoose');

const { Schema } = mongoose;

const poolSchema = new Schema(
  {
    poolName: {
      type: String,
      required: true,
    },
    contractAddress: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },

    tokenAddress: {
      type: String,
      require: true,
      lowercase: true,
    },

    lpTokenAddress: {
      type: String,
      lowercase: true,
      default: null,
      lowercase: true,
    },
    loyalityPoints: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      default: null,
    },
    contractType: {
      type: String,
      enum: ['farming', 'staking'],
      required: true,
    },
    endDate: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Number,
      default: 0,
    },
    withdrawDate: {
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

module.exports = mongoose.model('pool', poolSchema);
