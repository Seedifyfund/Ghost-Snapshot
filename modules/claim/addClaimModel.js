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
    networkName: {
      type: String,
      required: true,
      enum: ["polygon", "binance", "ethereum", "solana", "avalanche"],
      lowercase: true,
    },
    networkSymbol: {
      type: String,
      required: true,
      enum: ["BNB", "ETH", "MATIC", "SOL", "AVAX"],
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
        phaseNo: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ["upcoming", "pending", "uploaded"],
          default: "upcoming",
        },
      },
    ],
    currentVestingId : {
      type: String,
      default: null,
    },
    prevIgoDate : {
      type: Date,
      default: null,
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
