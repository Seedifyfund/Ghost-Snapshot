const mongoose = require('mongoose');
const { roles } = require('../../helper/enum');

const { Schema } = mongoose;

const adminSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    // role: {
    //   type: Schema.Types.ObjectId,
    //   ref: "roles",
    //   required: true,
    // },
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

module.exports = mongoose.model('admin', adminSchema);
