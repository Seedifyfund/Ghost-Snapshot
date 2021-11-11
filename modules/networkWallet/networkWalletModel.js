const mongoose = require('mongoose');

const { Schema } = mongoose;

const networkWalletSchema = new Schema(
  {
    networkId: {
      type: Schema.Types.ObjectId,
      ref: 'network',
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
    },
    userId: [{ type: Schema.Types.ObjectId, ref: 'user' }],
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model('networkwallet', networkWalletSchema);
