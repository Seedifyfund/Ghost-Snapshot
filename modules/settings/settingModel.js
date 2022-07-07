const mongoose = require("mongoose");
const { Schema } = mongoose;

const settingSchema = new Schema(
  {
    ccMailAddress: {
      type: [String],
      default: [],
    },
    seedifyMailAddress: {
      type: [String],
      default: [],
    }
  },
  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model("setting", settingSchema);
