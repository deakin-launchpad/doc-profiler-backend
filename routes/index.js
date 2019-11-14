/**
 * Created by Navit
 */
"use strict";

var DemoBaseRoute = require("./demoRoute/demoBaseRoute");
var UserBaseRoute = require("./userRoute/userBaseRoute");
var AdminBaseRoute = require("./adminRoute/adminBaseRoute");
var UploadBaseRoute = require("./uploadRoute/uploadBaseRoute");
var DocumentBaseRoute = require("./documentRoute/documentBaseRoute");
var ReportBaseRoute = require("./reportRoute/reportBaseRoute");
var APIs = [].concat(DemoBaseRoute, UserBaseRoute, AdminBaseRoute, UploadBaseRoute, DocumentBaseRoute, ReportBaseRoute);
module.exports = APIs;
