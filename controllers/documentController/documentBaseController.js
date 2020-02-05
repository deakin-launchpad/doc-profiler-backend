var Service = require("../../services");
var UniversalFunctions = require("../../utils/universalFunctions");
var async = require("async");
var ERROR = UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR;
var _ = require("underscore");
var fs = require("file-system");
var AWS = require('ibm-cos-sdk');
var CONFIG = require('../../config');
var request = require("request");
var Path = require('path');
var pdfreader = require("pdfreader");
var uploadManager = require("../../lib/uploadManager");
var mammoth = require("mammoth");
var redisClient = require("../../utils/redisConnect").redisClient;

var ibms3Config = {
  endpoint: CONFIG.AWS_S3_CONFIG.s3BucketCredentials.endpoint,
  apiKeyId: CONFIG.AWS_S3_CONFIG.s3BucketCredentials.apiKeyId,
  serviceInstanceId: CONFIG.AWS_S3_CONFIG.s3BucketCredentials.serviceInstanceId
};
var s3 = new AWS.S3(ibms3Config);

var createDocument = function (userData, payloadData, callback) {
  async.series(
    [
      function (cb) {
        var query = {
          _id: userData._id
        };
        var projection = {
          __v: 0,
          password: 0,
          accessToken: 0,
          codeUpdatedAt: 0
        };
        var options = { lean: true };
        Service.AdminService.getAdmin(query, projection, options, function (
          err,
          data
        ) {
          if (err) {
            cb(err);
          } else {
            if (data.length == 0) cb(ERROR.INCORRECT_ACCESSTOKEN);
            else {
              var adminData = (data && data[0]) || null;
              if (adminData.isBlocked) cb(ERROR.ACCOUNT_BLOCKED);
              else cb();
            }
          }
        });
      },
      function (cb) {
        var objToSave = {
          userId: payloadData.userId,
          link: payloadData.url
        }
        Service.DocumentService.createDocument(objToSave, function (err, data) {
          if (err) {
            cb(err);
          } else {
            if (data !== null || data !== undefined) {
              analyseDocument(data, userData);
            }
            cb();
          }
        });
      }
    ],
    function (err, result) {
      if (err) callback(err);
      else callback(null, { documentData: payloadData });
    }
  );
}

var getDocument = function (userData, payloadData, callback) {
  var documentData;
  async.series(
    [
      function (cb) {
        var query = {
          _id: userData._id
        };
        var projection = {
          __v: 0,
          password: 0,
          accessToken: 0,
          codeUpdatedAt: 0
        };
        var options = { lean: true };
        Service.AdminService.getAdmin(query, projection, options, function (
          err,
          data
        ) {
          if (err) {
            cb(err);
          } else {
            if (data.length == 0) cb(ERROR.INCORRECT_ACCESSTOKEN);
            else {
              var adminData = (data && data[0]) || null;
              if (adminData.isBlocked) cb(ERROR.ACCOUNT_BLOCKED);
              else cb();
            }
          }
        });
      },
      function (cb) {
        var criteria = {
          _id: payloadData.documentId,
          active: true
        };
        var projection = {

        };
        var options = { lean: true };
        Service.DocumentService.getDocument(criteria, projection, options, function (err, data) {
          if (err) {
            cb(err);
          } else {
            if (data.length == 0) cb(ERROR.NOT_FOUND);
            else {
              documentData = (data && data[0]) || null;
              cb();
            }
          }
        });
      }
    ],
    function (err, result) {
      if (err) callback(err);
      else callback(null, { documentData: documentData });
    }
  );
};

var getDocumentsData = function (userData, callback) {
  var documentData;
  async.series(
    [
      function (cb) {
        var query = {
          _id: userData._id
        };
        var projection = {
          __v: 0,
          password: 0,
          accessToken: 0,
          codeUpdatedAt: 0
        };
        var options = { lean: true };
        Service.AdminService.getAdmin(query, projection, options, function (
          err,
          data
        ) {
          if (err) {
            cb(err);
          } else {
            if (data.length == 0) cb(ERROR.INCORRECT_ACCESSTOKEN);
            else {
              var adminData = (data && data[0]) || null;
              if (adminData.isBlocked) cb(ERROR.ACCOUNT_BLOCKED);
              else cb();
            }
          }
        });
      },
      function (cb) {
        var criteria = {
          isProcessed: "PROCESSED",
          active: true
        };
        var projection = {
          _id: 1,
          userId: 1,
          link: 1,
          analysisReports: 1
        };
        var options = { lean: true };
        Service.DocumentService.getDocument(criteria, projection, options, function (err, data) {
          if (err) {
            cb(err);
          } else {
            if (data.length == 0) cb(ERROR.NO_DOCUMENTS_FOUND);
            else {
              temp = [];
              if (data.length > 0) {
                data.forEach((item) => {
                  let concepts = '';
                  for (let i = 0; i < item.analysisReports.nluAnalysis.concepts.length - 2; i++) {
                    concepts += item.analysisReports.nluAnalysis.concepts[i].text + ', ';
                  } 
                  concepts += item.analysisReports.nluAnalysis.concepts[item.analysisReports.nluAnalysis.concepts.length - 1].text;
                  let clientSupNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Client Supervisor Negative' });
                  let clientSupPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Client Supervisor Positive' });
                  let taskMgmtPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Task Mgmt Positive' });
                  let taskMgmtNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Task Mgmt Negative' });
                  let teamMgmtNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Team Mgmt Negative' });
                  let teamMgmtPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Team Mgmt Positive' });
                  let selfMgmtNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Self Mgmt Negative' });
                  let selfMgmtPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Self Mgmt Positive' });
                  let  commNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Communication Negative' });
                  let  commPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Communication Positive' });
                  let learnNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Learning Negative' });
                  let learnPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Learning Positive' });
                  let overNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Overall Negative' });
                  let overPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Overall Positive' });
                  let emotionNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Emotions Negative' });
                  let emotionPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Emotions Positive' });
                  let org = _.findWhere(item.analysisReports.classifiers, { class_name: 'Organizer' });
                  let doer = _.findWhere(item.analysisReports.classifiers, { class_name: 'Doer' });
                  let leader = _.findWhere(item.analysisReports.classifiers, { class_name: 'Leader' });
                  let supporter = _.findWhere(item.analysisReports.classifiers, { class_name: 'Supporter' });

                  temp.push({
                    docId: item._id,
                    userId: item.userId,
                    downloadLink: item.link,
                    sentiment: item.analysisReports.nluAnalysis.sentiment.label,
                    sentiment_score: item.analysisReports.nluAnalysis.sentiment.score,
                    'emotion_sadness (%)': item.analysisReports.nluAnalysis.emotion.sadness,
                    'emotion_joy (%)': item.analysisReports.nluAnalysis.emotion.joy,
                    'emotion_fear (%)': item.analysisReports.nluAnalysis.emotion.fear,
                    'emotion_disgust (%)': item.analysisReports.nluAnalysis.emotion.disgust,
                    'emotion_anger (%)': item.analysisReports.nluAnalysis.emotion.anger,
                    concepts: concepts,
                    personality_summary: item.analysisReports.personality_Insights.summary,
                    'personality_opennness (%)': item.analysisReports.personality_Insights.personality[0].percentile,
                    'personality_conscientiousness (%)': item.analysisReports.personality_Insights.personality[1].percentile,
                    'personality_Agreeableness (%)': item.analysisReports.personality_Insights.personality[3].percentile,
                    'personality_emotional_range (%)': item.analysisReports.personality_Insights.personality[4].percentile,
                    'Client Supervisor Negative (%)': clientSupNeg !== undefined ? clientSupNeg.average_confidence : 0,
                    'Client Supervisor Positive (%)': clientSupPos !== undefined ? clientSupPos.average_confidence : 0,
                    'Task Mgmt Positive (%)': taskMgmtPos !== undefined ? taskMgmtPos.average_confidence : 0,
                    'Task Mgmt Negative (%)': taskMgmtNeg !== undefined ? taskMgmtNeg.average_confidence : 0,
                    'Team Mgmt Negative (%)': teamMgmtNeg !== undefined ? teamMgmtNeg.average_confidence : 0,
                    'Team Mgmt Positive (%)': teamMgmtPos !== undefined ? teamMgmtPos.average_confidence : 0,
                    'Self Mgmt Negative (%)': selfMgmtNeg !== undefined ? selfMgmtNeg.average_confidence : 0,
                    'Self Mgmt Positive (%)': selfMgmtPos !== undefined ? selfMgmtPos.average_confidence : 0,
                    'Communication Negative (%)': commNeg !== undefined ? commNeg.average_confidence : 0,
                    'Communication Positive (%)': commPos !== undefined ? commPos.average_confidence : 0,
                    'Learning Negative (%)': learnNeg !== undefined ? learnNeg.average_confidence : 0,
                    'Learning Positive (%)': learnPos !== undefined ? learnPos.average_confidence : 0,
                    'Overall Negative (%)': overNeg !== undefined ? overNeg.average_confidence : 0,
                    'Overall Positive (%)': overPos !== undefined ? overPos.average_confidence : 0,
                    'Emotions Negative (%)': emotionNeg !== undefined ? emotionNeg.average_confidence : 0,
                    'Emotions Positive (%)': emotionPos !== undefined ? emotionPos.average_confidence : 0,
                    'Organizer (%)': org !== undefined ? org.average_confidence : 0,
                    'Doer (%)' : doer !== undefined ? doer.average_confidence : 0,
                    'Leader (%)': leader !== undefined ? leader.average_confidence : 0,
                    'Supporter (%)': supporter !== undefined ? supporter.average_confidence : 0
                  });
                })
              }
              documentData = temp || null;
              cb();
            }
          }
        });
      }
    ],
    function (err, result) {
      if (err) callback(err);
      else callback(null, { documentData: documentData });
    }
  );
};

var getDocumentsDataByUserId = function (userData, payloadData, callback) {
  var documentData;
  async.series(
    [
      function (cb) {
        var query = {
          _id: userData._id
        };
        var projection = {
          __v: 0,
          password: 0,
          accessToken: 0,
          codeUpdatedAt: 0
        };
        var options = { lean: true };
        Service.AdminService.getAdmin(query, projection, options, function (
          err,
          data
        ) {
          if (err) {
            cb(err);
          } else {
            if (data.length == 0) cb(ERROR.INCORRECT_ACCESSTOKEN);
            else {
              var adminData = (data && data[0]) || null;
              if (adminData.isBlocked) cb(ERROR.ACCOUNT_BLOCKED);
              else cb();
            }
          }
        });
      },
      function (cb) {
        var criteria = {
          userId: payloadData.userId,
          isProcessed: "PROCESSED",
          active: true
        };
        var projection = {
          _id: 1,
          userId: 1,
          link: 1,
          analysisReports: 1
        };
        var options = { lean: true };
        Service.DocumentService.getDocument(criteria, projection, options, function (err, data) {
          if (err) {
            cb(err);
          } else {
            if (data.length == 0) cb(ERROR.NO_DOCUMENTS_FOUND);
            else {
              temp = [];
              if (data.length > 0) {
                data.forEach((item) => {
                  let concepts = '';
                  for (let i = 0; i < item.analysisReports.nluAnalysis.concepts.length - 2; i++) {
                    concepts += item.analysisReports.nluAnalysis.concepts[i].text + ', ';
                  } 
                  concepts += item.analysisReports.nluAnalysis.concepts[item.analysisReports.nluAnalysis.concepts.length - 1].text;
                  let clientSupNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Client Supervisor Negative' });
                  let clientSupPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Client Supervisor Positive' });
                  let taskMgmtPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Task Mgmt Positive' });
                  let taskMgmtNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Task Mgmt Negative' });
                  let teamMgmtNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Team Mgmt Negative' });
                  let teamMgmtPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Team Mgmt Positive' });
                  let selfMgmtNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Self Mgmt Negative' });
                  let selfMgmtPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Self Mgmt Positive' });
                  let  commNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Communication Negative' });
                  let  commPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Communication Positive' });
                  let learnNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Learning Negative' });
                  let learnPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Learning Positive' });
                  let overNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Overall Negative' });
                  let overPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Overall Positive' });
                  let emotionNeg = _.findWhere(item.analysisReports.classifiers, { class_name: 'Emotions Negative' });
                  let emotionPos = _.findWhere(item.analysisReports.classifiers, { class_name: 'Emotions Positive' });
                  let org = _.findWhere(item.analysisReports.classifiers, { class_name: 'Organizer' });
                  let doer = _.findWhere(item.analysisReports.classifiers, { class_name: 'Doer' });
                  let leader = _.findWhere(item.analysisReports.classifiers, { class_name: 'Leader' });
                  let supporter = _.findWhere(item.analysisReports.classifiers, { class_name: 'Supporter' });

                  temp.push({
                    docId: item._id,
                    userId: item.userId,
                    downloadLink: item.link,
                    sentiment: item.analysisReports.nluAnalysis.sentiment.label,
                    sentiment_score: item.analysisReports.nluAnalysis.sentiment.score,
                    'emotion_sadness (%)': item.analysisReports.nluAnalysis.emotion.sadness,
                    'emotion_joy (%)': item.analysisReports.nluAnalysis.emotion.joy,
                    'emotion_fear (%)': item.analysisReports.nluAnalysis.emotion.fear,
                    'emotion_disgust (%)': item.analysisReports.nluAnalysis.emotion.disgust,
                    'emotion_anger (%)': item.analysisReports.nluAnalysis.emotion.anger,
                    concepts: concepts,
                    personality_summary: item.analysisReports.personality_Insights.summary,
                    'personality_opennness (%)': item.analysisReports.personality_Insights.personality[0].percentile,
                    'personality_conscientiousness (%)': item.analysisReports.personality_Insights.personality[1].percentile,
                    'personality_Agreeableness (%)': item.analysisReports.personality_Insights.personality[3].percentile,
                    'personality_emotional_range (%)': item.analysisReports.personality_Insights.personality[4].percentile,
                    'Client Supervisor Negative (%)': clientSupNeg !== undefined ? clientSupNeg.average_confidence : 0,
                    'Client Supervisor Positive (%)': clientSupPos !== undefined ? clientSupPos.average_confidence : 0,
                    'Task Mgmt Positive (%)': taskMgmtPos !== undefined ? taskMgmtPos.average_confidence : 0,
                    'Task Mgmt Negative (%)': taskMgmtNeg !== undefined ? taskMgmtNeg.average_confidence : 0,
                    'Team Mgmt Negative (%)': teamMgmtNeg !== undefined ? teamMgmtNeg.average_confidence : 0,
                    'Team Mgmt Positive (%)': teamMgmtPos !== undefined ? teamMgmtPos.average_confidence : 0,
                    'Self Mgmt Negative (%)': selfMgmtNeg !== undefined ? selfMgmtNeg.average_confidence : 0,
                    'Self Mgmt Positive (%)': selfMgmtPos !== undefined ? selfMgmtPos.average_confidence : 0,
                    'Communication Negative (%)': commNeg !== undefined ? commNeg.average_confidence : 0,
                    'Communication Positive (%)': commPos !== undefined ? commPos.average_confidence : 0,
                    'Learning Negative (%)': learnNeg !== undefined ? learnNeg.average_confidence : 0,
                    'Learning Positive (%)': learnPos !== undefined ? learnPos.average_confidence : 0,
                    'Overall Negative (%)': overNeg !== undefined ? overNeg.average_confidence : 0,
                    'Overall Positive (%)': overPos !== undefined ? overPos.average_confidence : 0,
                    'Emotions Negative (%)': emotionNeg !== undefined ? emotionNeg.average_confidence : 0,
                    'Emotions Positive (%)': emotionPos !== undefined ? emotionPos.average_confidence : 0,
                    'Organizer (%)': org !== undefined ? org.average_confidence : 0,
                    'Doer (%)' : doer !== undefined ? doer.average_confidence : 0,
                    'Leader (%)': leader !== undefined ? leader.average_confidence : 0,
                    'Supporter (%)': supporter !== undefined ? supporter.average_confidence : 0
                  });
                })
              }
              documentData = temp || null;
              cb();
            }
          }
        });
      }
    ],
    function (err, result) {
      if (err) callback(err);
      else callback(null, { documentData: documentData });
    }
  );
};

var getDocumentsByUserId = function (userData, payloadData, callback) {
  var documentData;
  async.series(
    [
      function (cb) {
        var query = {
          _id: userData._id
        };
        var projection = {
          __v: 0,
          password: 0,
          accessToken: 0,
          codeUpdatedAt: 0
        };
        var options = { lean: true };
        Service.AdminService.getAdmin(query, projection, options, function (
          err,
          data
        ) {
          if (err) {
            cb(err);
          } else {
            if (data.length == 0) cb(ERROR.INCORRECT_ACCESSTOKEN);
            else {
              var adminData = (data && data[0]) || null;
              if (adminData.isBlocked) cb(ERROR.ACCOUNT_BLOCKED);
              else cb();
            }
          }
        });
      },
      function (cb) {
        var criteria = {
          userId: payloadData.userId,
          active: true
        };
        var projection = {
        };
        var options = { lean: true };
        Service.DocumentService.getDocument(criteria, projection, options, function (err, data) {
          if (err) {
            cb(err);
          } else {
            // if (data.length == 0) cb();
            // else {
            documentData = (data) || null;
            cb();
            // }
          }
        });
      }
    ],
    function (err, result) {
      if (err) callback(err);
      else callback(null, { documentData: documentData });
    }
  );
};

var deleteDocument = function (userData, payloadData, callback) {
  // var documentsFound = null;
  async.series(
    [
      function (cb) {
        var query = {
          _id: userData._id
        };
        var projection = {
          __v: 0,
          password: 0,
          accessToken: 0,
          codeUpdatedAt: 0
        };
        var options = { lean: true };
        Service.AdminService.getAdmin(query, projection, options, function (
          err,
          data
        ) {
          if (err) {
            cb(err);
          } else {
            if (data.length == 0) cb(ERROR.INCORRECT_ACCESSTOKEN);
            else {
              var adminData = (data && data[0]) || null;
              if (adminData.isBlocked) cb(ERROR.ACCOUNT_BLOCKED);
              else cb();
            }
          }
        });
      },
      function (cb) {
        var criteria = {
          userId: payloadData.userId,
          _id: { $in: payloadData.documentId }
        };
        var dataToSet = {
          active: false
        };
        var options = { lean: true };
        Service.DocumentService.updateDocumentsList(criteria, dataToSet, options, function (err, data) {
          if (err) {
            cb(err);
          } else {
            cb();
          }
        });
      }
    ],
    function (err, result) {
      if (err) callback(err);
      else callback(null, { documentData: payloadData });
    }
  );
};

var retryDocumentAnalysis = function (userData, payloadData, callback) {
  async.series(
    [
      function (cb) {
        var query = {
          _id: userData._id
        };
        var projection = {
          __v: 0,
          password: 0,
          accessToken: 0,
          codeUpdatedAt: 0
        };
        var options = { lean: true };
        Service.AdminService.getAdmin(query, projection, options, function (
          err,
          data
        ) {
          if (err) {
            cb(err);
          } else {
            if (data.length == 0) cb(ERROR.INCORRECT_ACCESSTOKEN);
            else {
              var adminData = (data && data[0]) || null;
              if (adminData.isBlocked) cb(ERROR.ACCOUNT_BLOCKED);
              else cb();
            }
          }
        });
      },
      function (cb) {
        var criteria = {
          _id: payloadData.documentId,
          userId: payloadData.userId
        };
        var projection = {
        };
        var options = { lean: true };
        Service.DocumentService.getDocument(criteria, projection, options, function (err, data) {
          if (err) {
            cb(err);
          } else {
            // if (data.length == 0) cb();
            // else {
            if (data[0].isProcessed === "PROCESSED")
              cb(ERROR.DOCUMENT_ALREADY_PROCESSED)
            // documentData = (data) || null;
            else cb();
            // }
          }
        });
      },
      function (cb) {
        var criteria = {
          _id: payloadData.documentId,
          userId: payloadData.userId
        };
        var dataToSet = {
          isProcessed: "PROCESSING"
        };
        var options = { lean: true };
        Service.DocumentService.updateDocumentsList(criteria, dataToSet, options, function (err, data) {
          if (err) {
            cb(err);
          } else {
            cb();
          }
        });
      },
      function (cb) {
        redisClient.hgetall(userData._id.toString(), function (err, obj) {
          if (obj && obj.socketId) {
            process.emit("refreshContent", {
              socketId: obj.socketId
            });
            cb()
          }
          else cb(err)
        })
      },
      function (cb) {
        var criteria = {
          userId: payloadData.userId,
          _id: payloadData.documentId
        };
        var projection = {
        };
        var options = { lean: true };
        Service.DocumentService.getDocument(criteria, projection, options, function (err, data) {
          if (err) {
            cb(err);
          } else {
            if (data === null || data === undefined) cb(ERROR.NOT_FOUND);
            else {
              analyseDocument(data && data[0], userData);
              cb();
            }
          }
        });
      }
    ],
    function (err, result) {
      if (err) callback(err);
      else callback(null, { documentData: payloadData });
    }
  );
};

var analyseDocument = function (documentData, userData) {
  var dataForWatson = "";
  var dataFromWatson = "";
  var obj = {};
  var profileFolderUploadPath = CONFIG.AWS_S3_CONFIG.s3BucketCredentials.projectFolder + "/docs";
  var path = Path.resolve("..") + "/uploads/" + profileFolderUploadPath + "/";
  async.series(
    [
      function (cb) {
        var url = documentData.link;
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
                      dataForWatson = html.replace(/<[^>]*>?/gm, '');
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
              dataForWatson = data.Body.toString();
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
                            dataForWatson = item.text;
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
      function (cb) {
        // console.log("-----------dataForWatson----------", dataForWatson);
        let formDATA = {
          "data": dataForWatson
        };
        request.post({ url: process.env.ANALYSE_SERVER + "/api/report/create", formData: formDATA }, function (err, response) {
          if (err) {
            var criteria = {
              _id: documentData._id
            };
            var dataToSet = {
              isProcessed: "ERROR",
            };
            var options = { lean: true };
            redisClient.hgetall(userData._id.toString(), function (err, obj) {
              if (obj && obj.socketId) {
                process.emit("refreshContentForError", {
                  socketId: obj.socketId
                });
                // cb()
              }
              // else cb(err)
            })
            Service.DocumentService.updateDocumentsList(criteria, dataToSet, options, function (error, data) {
              if (error) {
                cb(error);
              } else {
                cb(err);
              }
            });
          } else {
            redisClient.hgetall(userData._id.toString(), function (err, obj) {
              if (obj && obj.socketId) {
                process.emit("refreshContent", {
                  socketId: obj.socketId
                });
                // cb()
              }
              // else cb(err)
            })
            dataFromWatson = response.body;
            // console.log("-----------dataWatson----------", dataFromWatson);
            cb();
          }
        });
      },
      function (cb) {
        var data = JSON.parse(dataFromWatson).data;
        if (data.nLUAnalysis === undefined && data.personality_Insights === undefined && data.classifier_tags ===  undefined) {
          obj = null;
        }
        if (data.nLUAnalysis !== undefined) {
          var nlu = data.nLUAnalysis.testData;
          var categories = [];
          var concepts = [];
          var emotion = {};
          var sentiment = {};
          if (nlu.categories !== undefined && nlu.categories !== null && nlu.categories.length > 0) {
            nlu.categories.map((item) => {
              categories.push({
                score: Math.round(item.score * 100),
                label: item.label
              });
              return categories;
            });
          }
          if (nlu.concepts !== undefined && nlu.concepts !== null && nlu.concepts.length > 0) {
            nlu.concepts.map((item) => {
              concepts.push({
                relevance: Math.round(item.relevance * 100),
                text: item.text
              });
              return concepts;
            });
          }
          if (nlu.emotion !== undefined && nlu.emotion !== null && Object.keys(nlu.emotion.document.emotion).length > 0) {
            Object.keys(nlu.emotion.document.emotion).map((value) => {
              emotion[value] = Math.round(nlu.emotion.document.emotion[value] * 100);
            });
          }
          if (nlu.sentiment !== undefined && nlu.sentiment !== null && Object.keys(nlu.sentiment.document).length > 0) {
            sentiment.label = nlu.sentiment.document.label;
            sentiment.score = Math.round(nlu.sentiment.document.score * 100) / 100;
          }
          obj.nluAnalysis = {
            categories: categories,
            concepts: concepts,
            emotion: emotion,
            sentiment: sentiment
          }
        }

        if (data.personality_Insights !== undefined) {
          var personalityInsightsSummary = data.personality_Insights.summary;
          var personalityInsights = data.personality_Insights.testData;
          var needs = [];
          var personality = [];
          var values = [];
          if (personalityInsights.needs !== undefined && personalityInsights.needs !== null && personalityInsights.needs.length > 0) {
            personalityInsights.needs.map((item) => {
              needs.push({
                name: item.name,
                percentile: Math.round(item.percentile * 100)
              });
              return needs;
            });
          }
          if (personalityInsights.personality !== undefined && personalityInsights.personality !== null && personalityInsights.personality.length > 0) {
            personalityInsights.personality.map((item) => {
              personality.push({
                name: item.name,
                percentile: Math.round(item.percentile * 100)
              });
              return personality;
            });
          }
          if (personalityInsights.values !== undefined && personalityInsights.values !== null && personalityInsights.values.length > 0) {
            personalityInsights.values.map((item) => {
              values.push({
                name: item.name,
                percentile: Math.round(item.percentile * 100)
              });
              return values;
            });
          }
          obj.personality_Insights = {
            summary: personalityInsightsSummary,
            needs: needs,
            personality: personality,
            values: values,
            warnings: personalityInsights.warnings
          }
        }
        
        if (data.classifier_tags !==  undefined) {
          obj.classifiers = data.classifier_tags
        }
        cb();
      },
      function (cb) {
        var criteria = {
          _id: documentData._id
        };
        var dataToSet = {
          isProcessed: "PROCESSED",
          analysisReports: obj
        };
        var options = { lean: true };
        redisClient.hgetall(userData._id.toString(), function (err, obj) {
          if (obj && obj.socketId) {
            process.emit("refreshContent", {
              socketId: obj.socketId
            });
            // cb()
          }
          // else cb(err)
        })
        Service.DocumentService.updateDocumentsList(criteria, dataToSet, options, function (err, data) {
          if (err) {
            cb(err);
          } else {
            cb();
          }
        });
      }
    ],
    function (err, result) {
      if (err) console.log(err);
      else console.log(dataFromWatson);
    }
  );
}



module.exports = {
  createDocument: createDocument,
  // updateDocument: updateDocument,
  getDocument: getDocument,
  getDocumentsByUserId: getDocumentsByUserId,
  getDocumentsData: getDocumentsData,
  getDocumentsDataByUserId: getDocumentsDataByUserId,
  deleteDocument: deleteDocument,
  retryDocumentAnalysis: retryDocumentAnalysis
};