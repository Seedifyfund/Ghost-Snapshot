const mongoose = require("mongoose");
const { Schema } = mongoose;

const LogSchema = new Schema(
  {
    action: { type: String, required: true },
    category: { type: String, required: true },
    createdBy: { type: mongoose.Schema.ObjectId, ref: "admin", required: true },
    message: { type: String, required: true },
    diff: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

LogSchema.index({ action: 1, category: 1 });

module.exports = mongoose.model("log", LogSchema);
