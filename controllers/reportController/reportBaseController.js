var AWS = require('ibm-cos-sdk');
var CONFIG = require('../../config');
var Path = require('path');
var fs = require("file-system");
var mammoth = require("mammoth");
const async = require('async');
var request = require("request");
var pdfreader = require("pdfreader");
var uploadManager = require("../../lib/uploadManager");

var ibms3Config = {
  endpoint: CONFIG.AWS_S3_CONFIG.s3BucketCredentials.endpoint,
  apiKeyId: CONFIG.AWS_S3_CONFIG.s3BucketCredentials.apiKeyId,
  serviceInstanceId: CONFIG.AWS_S3_CONFIG.s3BucketCredentials.serviceInstanceId
};
var s3 = new AWS.S3(ibms3Config);

const createReport = function (payloadData, callback) {
  var dataToSend;
  async.series([
    function(cb) {
      var formDATA = {
        "data": payloadData
      }
      request.post({ url: process.env.ANALYSE_SERVER + "/api/report/create", formData: formDATA }, function (err, response) {
        if (err) {
          cb(err);
        } else {
          dataToSend = response.body;
          cb();
        }
      });
    }
  ], function (err, result) {
    if (err) callback(err);
    else return callback(null, dataToSend);
  });
};

const sentenceAnalysis = function (payloadData, callback) {
  var dataToSend;
  var docData = '';
  var profileFolderUploadPath = CONFIG.AWS_S3_CONFIG.s3BucketCredentials.projectFolder + "/docs";
  var path = Path.resolve("..") + "/uploads/" + profileFolderUploadPath + "/";
  async.series([
    function(cb) {
      if (payloadData.url === '' || payloadData.url === undefined || payloadData.url === null) return cb();
      var url = payloadData.url;
      var fileName = "files/docs/original/" + url.substring(url.lastIndexOf('/') + 1);
      var type = url.substring(url.lastIndexOf('.') + 1);

      var params = {
        Bucket: "doc-profiler-bucket",
        Key: fileName
      }
      if (type === "docx") {
        s3.getObject(params, function (err, data) {
          if (err) {
            console.log(err);
          } else {
            // console.log("---------data----------");
            fileName = url.substring(url.lastIndexOf('/') + 1);
            fs.appendFile(path + fileName, new Buffer(data.Body.buffer), function (err) {
              if (err) {
                console.log(err);
              } else {
                mammoth.convertToHtml({ path: path + fileName })
                  .then(function (result) {
                    var html = result.value; // The generated HTML
                    html.replace(/<[^>]*>?/gm, '');
                    var messages = result.messages; // Any messages, such as warnings during conversion
                    docData = html.replace(/<[^>]*>?/gm, '');
                    // console.log(dataForWatson);
                  })
                  .done(function () {
                    uploadManager.deleteFile(path + fileName, cb);
                  });
              }
            });
          }
        });
      } else if (type === "txt") {
        s3.getObject(params, function (err, data) {
          if (err) {
            console.log(err);
          } else {
            // console.log("---------data----------");
            docData = data.Body.toString();
            // console.log(dataForWatson);
            cb();
          }
        });

      } else if (type === "pdf") {
        s3.getObject(params, function (err, data) {
          if (err) {
            console.log(err);
          } else {
            // console.log("---------data----------");
            fileName = url.substring(url.lastIndexOf('/') + 1);
            fs.appendFile(path + fileName, new Buffer(data.Body.buffer), function (err) {
              if (err) {
                console.log(err)
              } else {
                async.series(
                  [
                    function (cb) {
                      new pdfreader.PdfReader().parseFileItems(path + fileName, function (err, item) {
                        if (err) console.log(err);
                        else if (!item) return;
                        else if (item.text) {
                          docData = item.text;
                          cb();
                        }
                      });
                    },
                    function (cb) {
                      uploadManager.deleteFile(path + fileName, cb);
                    }
                  ],
                  function (err, result) {
                    if (err) cb(err);
                    else cb();
                  }
                );
              }
            });
          }
        });
      }
    },
    function(cb) {
      var formDATA = {
        "data": docData === '' ? payloadData.data : docData
      }
      request.post({ url: process.env.ANALYSE_SERVER + "/api/report/sentenceAnalysis", formData: formDATA }, function (err, response) {
        if (err) {
          cb(err);
        } else {
          // console.log(response.body);
          dataToSend = response.body;
          cb();
        }
      });
    }
  ], function (err, result) {
    if (err) callback(err);
    else return callback(null, dataToSend);
  });
};
async.series([])

module.exports = {
  createReport: createReport,
  sentenceAnalysis: sentenceAnalysis
};
