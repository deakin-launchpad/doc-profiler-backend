var Service = require("../../services");
var UniversalFunctions = require("../../utils/universalFunctions");
var async = require("async");
var ERROR = UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR;
var _ = require("underscore");
var fs = require("file-system");
var AWS = require('ibm-cos-sdk');
var CONFIG = require('../../config');
var request = require("request")
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
                    status: true
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
    var obj;
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
                            console.log("---------data----------");
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
                                            console.log(dataForWatson);

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
                            console.log("---------data----------");
                            dataForWatson = data.Body.toString();
                            console.log(dataForWatson);
                            cb();
                        }
                    });

                } else if (type === "pdf") {
                    s3.getObject(params, function (err, data) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("---------data----------");

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
                console.log("-----------dataForWatson----------", dataForWatson);
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
                        console.log("-----------dataWatson----------", dataFromWatson);
                        cb();
                    }
                });
            },
            function (cb) {
                var data = JSON.parse(dataFromWatson).data;
                if (data.nLUAnalysis === undefined && data.personality_Insights === undefined) {
                    obj = null;
                    cb();
                } else if (data.nLUAnalysis !== undefined && data.personality_Insights === undefined) {
                    var nlu = data.nLUAnalysis.testData;
                    obj = {
                        nluAnalysis: {
                            categories: nlu.categories,
                            concepts: nlu.concepts,
                            emotion: nlu.emotion.document.emotion,
                            sentiment: nlu.sentiment.document
                        }
                    }
                    cb();
                } else if (data.nLUAnalysis === undefined && data.personality_Insights !== undefined) {
                    var personalityInsightsSummary = data.personality_Insights.summary;
                    var personalityInsights = data.personality_Insights.testData;
                    obj = {
                        personality_Insights: {
                            summary: personalityInsightsSummary,
                            needs: personalityInsights.needs,
                            personality: personalityInsights.personality,
                            values: personalityInsights.values,
                            warnings: personalityInsights.warnings
                        }
                    }
                    cb();
                } else {
                    var nlu = data.nLUAnalysis.testData;
                    var personalityInsightsSummary = data.personality_Insights.summary;
                    var personalityInsights = data.personality_Insights.testData;
                    obj = {
                        nluAnalysis: {
                            categories: nlu.categories,
                            concepts: nlu.concepts,
                            emotion: nlu.emotion.document.emotion,
                            sentiment: nlu.sentiment.document
                        },
                        personalityInsights: {
                            summary: personalityInsightsSummary,
                            needs: personalityInsights.needs,
                            personality: personalityInsights.personality,
                            values: personalityInsights.values,
                            warnings: personalityInsights.warnings,
                        }
                    }
                    cb();
                }
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
    deleteDocument: deleteDocument,
    retryDocumentAnalysis: retryDocumentAnalysis
};