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
    loyalityPoints: {
      type: Number,
      require: true,
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
