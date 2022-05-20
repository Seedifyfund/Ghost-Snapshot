const mongoose = require("mongoose");
const { Schema } = mongoose;

const BlockSchema = new Schema(
  {
    poolAddress: {
      type: String,
      lowercase: true,
    },
    type: {
      type: String,
      default: "",
    },
    blockNo: {
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

module.exports = mongoose.model("blocks", BlockSchema);
