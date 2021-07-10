const { json } = require('body-parser');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const snapshotSchema = new Schema(
  {
    users: {
      type: JSON,
    },
    tier: {
      type: String,
    },
    totalUsers: {
      type: Number,
      default: 0,
    },
    isSnapshotDone: {
      type: Boolean,
      default: false,
    },
    snapshotId: {
      type: Number,
      default: null,
    },
    fileHash: {
      type: String,
      default: null,
    },
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model('snapshot', snapshotSchema);
