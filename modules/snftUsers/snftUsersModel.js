const mongoose = require('mongoose');

const { Schema } = mongoose;

const snftUserSchema = new Schema(
  {
    walletAddress: {
        type: String,
        required: true,
        lowercase: true,
      },
    tokens : {
        type : Array,
        default : []
    }
  },
  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model('snftusers', snftUserSchema);
