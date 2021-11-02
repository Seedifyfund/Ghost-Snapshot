const mongoose = require('mongoose');

const { Schema } = mongoose;

const blockSchema = new Schema(
  {
    lastBlock: {
      type: Number,
      required: true,
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

module.exports = mongoose.model('block', blockSchema);
