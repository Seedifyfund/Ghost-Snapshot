const LogSchema = require("./logsModel");
const _ = require("lodash");

const logsCtr = {};
logsCtr.getDiff = (curr, prev) => {
  function changes(object, base) {
    return _.transform(object, (result, value, key) => {
      if (!_.isEqual(value, base[key]))
        result[key] =
          _.isObject(value) && _.isObject(base[key])
            ? changes(value, base[key])
            : value;
    });
  }
  return changes(curr, prev);
};

logsCtr.plugin = function (schema) {
  schema.post("init", (doc) => {
    doc._original = doc.toObject({ transform: false });
  });
  schema.pre("save", function (next) {
    if (this.isNew) {
      next();
    } else {
      this._diff = logsCtr.getDiff(this, this._original);
      next();
    }
  });
  schema.methods.log = function (data) {
    data.diff = {
      before: this._original,
      after: this._diff,
    };
    return LogSchema.create(data);
  };
};

module.exports = logsCtr.plugin;
