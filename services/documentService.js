"use strict";

var Models = require("../models");

var updateDocument = function (criteria, dataToSet, options, callback) {
    options.lean = true;
    options.new = true;
    Models.Document.findOneAndUpdate(criteria, dataToSet, options, callback);
};
//Insert User Documents in DB
var createDocument = function (objToSave, callback) {
    new Models.Document(objToSave).save(callback);
};

//Get User Documents from DB
var getDocument = function (criteria, projection, options, callback) {
    options.lean = true;
    Models.Document.find(criteria, projection, options, callback);
};

var deleteDocument = function (criteria, callback) {
    Models.Document.findOneAndRemove(criteria, callback);
};

module.exports = {
    createDocument: createDocument,
    updateDocument: updateDocument,
    getDocument: getDocument,
    deleteDocument: deleteDocument
};