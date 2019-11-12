var Service = require("../../services");
var UniversalFunctions = require("../../utils/universalFunctions");
var async = require("async");
// var UploadManager = require('../../lib/uploadManager');
var TokenManager = require("../../lib/tokenManager");
var CodeGenerator = require("../../lib/codeGenerator");
var ERROR = UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR;
var _ = require("underscore");

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
                    _id: payloadData.documentId
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

module.exports = {
    createDocument: createDocument,
    // updateDocument: updateDocument,
    getDocument: getDocument,
    getDocumentsByUserId: getDocumentsByUserId
    // deleteDocument: deleteDocument
};