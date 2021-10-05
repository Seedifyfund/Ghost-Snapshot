const mongoose = require('mongoose');

const { Schema } = mongoose;

const networkSchema = new Schema(
  {
    networkName: {
      type: String,
      required: true,
      lowercase: true,
    },
    logo: {
      type: String,
      required: false,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model('network', networkSchema);
