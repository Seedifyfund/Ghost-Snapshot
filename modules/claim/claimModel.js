const mongoose = require("mongoose");

const { Schema } = mongoose;

const claimSchema = new Schema(
  {
    contractAddress: {
      type: String,
      required: true,
      // lowercase: true,
    },
    tokenAddress: {
      type: String,
      required: true,
      // lowercase: true,
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
    vestingType: {
      type: String,
      required: true,
      enum: ["monthly", "linear", "merkle"],
      default: "monthly",
      
    },
    isDisabledBit: {
      type: Boolean,
      default: false,
    },
    dumpId: {
      type: mongoose.Schema.ObjectId,
      ref: "addClaim",
    },
    vestings : {
      type: Array,
      default: [],
    },
    phaseNo: {
      type: Number,
      required: true,
    },
    isSnft: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: "",
    }
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);
mongoose.plugin(require("../logs/logsHelper"));
module.exports = mongoose.model("claim", claimSchema);
