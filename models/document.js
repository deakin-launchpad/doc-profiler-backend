var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var Config = require("../config");

var document = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "user" },
    // title: { type: String, required: true },
    link: { type: String, required: true },
    isProcessed: { type: Boolean, default: false },
    analysisReports: {type: [String], default: []}
});

module.exports = mongoose.model("document", document);