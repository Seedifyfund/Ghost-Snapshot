const mongoose = require("mongoose");

const { Schema } = mongoose;

const addClaimSchema = new Schema(
  {
    contractAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    tokenAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    vestingInfo: {
      type: String,
      default : null
    },
    networkName: {
      type: String,
      required: true,
      enum: ["polygon", "binance", "ethereum", "solana", "avalanche", "fantom"],
      lowercase: true,
    },
    networkSymbol: {
      type: String,
      required: true,
      enum: ["BNB", "ETH", "MATIC", "SOL", "AVAX", "FTM"],
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
    timestamp: {
      type: Number,
      required: true,
    },
    endTime: {
      type: Number,
      default: null,
    },
    startAmount: {
      type: Number,
      default: null,
    },
    logo: {
      type: String,
      default: null,
    },
    phaseNo: {
      type: Number,
      required: true,
    },
    data: {
      type: Array,
      default: [],
    },
    uploadData: {
      type: Array,
      default: [],
    },
    pendingData: {
      type: Array,
      default: [],
    },
    iteration: {
      type: Number,
      default: 0,
    },
    vestings: [
      {
        name: { type: String, default: "" },
        vestingPercent: { type: Number, default: 0 },
        timestamp: { type: Number, default: 0 },
        rootHash: { type: String, default: '' },
        txnHash: { type: String, default: '' },
        status: {
          type: String,
          enum: ["upcoming", "pending", "uploaded", "failed"],
          default: "upcoming",
        },
      },
    ],
    vestingType: {
      type: String,
      required: true,
      enum: ["monthly", "linear", "merkle"],
      default: "monthly",
    },
    totalIterationCount: {
      type: Number,
      default: 0,
    },
    transactionHash: {
      type: Array,
      default: [],
    },
    isDisabledBit: {
      type: Boolean,
      default: false,
    },
    isSnft: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);
mongoose.plugin(require("../logs/logsHelper"));
module.exports = mongoose.model("addClaim", addClaimSchema);
