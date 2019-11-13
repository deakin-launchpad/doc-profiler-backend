var UniversalFunctions = require("../../utils/universalFunctions");
var Controller = require("../../controllers");
var Joi = require("joi");
var Config = require("../../config");

var createDocument = {
    method: "POST",
    path: "/api/document/createDocument",
    handler: function (request, h) {
        var userData =
            (request.auth &&
                request.auth.credentials &&
                request.auth.credentials.userData) ||
            null;
        var payloadData = request.payload;
        return new Promise((resolve, reject) => {
            Controller.DocumentBaseController.createDocument(userData, payloadData, function (
                error,
                success
            ) {
                if (error) {
                    reject(UniversalFunctions.sendError(error));
                } else {
                    resolve(
                        UniversalFunctions.sendSuccess(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                                .DEFAULT,
                            success
                        )
                    );
                }
            })
        });
    },
    config: {
        description: "Create a new document",
        tags: ["api", "document"],
        auth: "UserAuth",
        validate: {
            headers: UniversalFunctions.authorizationHeaderObj,
            payload: {
                userId: Joi.string().required(),
                url: Joi.string().required()
            },
            failAction: UniversalFunctions.failActionFunction
        },
        plugins: {
            "hapi-swagger": {
                responseMessages:
                    UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
            }
        }
    }
};

var getDocument = {
    method: "GET",
    path: "/api/document/getById",
    config: {
        description: "Get a particular document by id",
        auth: "UserAuth",
        tags: ["api", "document"],
        handler: function (request, h) {
            var userData =
                (request.auth &&
                    request.auth.credentials &&
                    request.auth.credentials.userData) ||
                null;
            var payloadData = request.query;
            return new Promise((resolve, reject) => {
                if (userData && userData._id) {
                    Controller.DocumentBaseController.getDocument(userData, payloadData, function (
                        error,
                        success
                    ) {
                        if (error) {
                            reject(UniversalFunctions.sendError(error));
                        } else {
                            resolve(
                                UniversalFunctions.sendSuccess(
                                    UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                                        .DEFAULT,
                                    success
                                )
                            );
                        }
                    });
                } else {
                    reject(
                        UniversalFunctions.sendError(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .INVALID_TOKEN
                        )
                    );
                }
            });
        },
        validate: {
            headers: UniversalFunctions.authorizationHeaderObj,
            failAction: UniversalFunctions.failActionFunction,
            query: {
                documentId: Joi.string().required()
            },
        },
        plugins: {
            "hapi-swagger": {
                responseMessages:
                    UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
            }
        }
    }
}

var getDocumentsByUserId = {
    method: "GET",
    path: "/api/document/getByUserId",
    config: {
        description: "Get documents for a user",
        auth: "UserAuth",
        tags: ["api", "document"],
        handler: function (request, h) {
            var userData =
                (request.auth &&
                    request.auth.credentials &&
                    request.auth.credentials.userData) ||
                null;
            var payloadData = request.query;
            return new Promise((resolve, reject) => {
                if (userData && userData._id) {
                    Controller.DocumentBaseController.getDocumentsByUserId(userData, payloadData, function (
                        error,
                        success
                    ) {
                        if (error) {
                            reject(UniversalFunctions.sendError(error));
                        } else {
                            resolve(
                                UniversalFunctions.sendSuccess(
                                    UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                                        .DEFAULT,
                                    success
                                )
                            );
                        }
                    });
                } else {
                    reject(
                        UniversalFunctions.sendError(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .INVALID_TOKEN
                        )
                    );
                }
            });
        },
        validate: {
            headers: UniversalFunctions.authorizationHeaderObj,
            failAction: UniversalFunctions.failActionFunction,
            query: {
                userId: Joi.string().required()
            },
        },
        plugins: {
            "hapi-swagger": {
                responseMessages:
                    UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
            }
        }
    }
}

var deleteDocument = {
    method: "DELETE",
    path: "/api/document/delete",
    handler: function(request, h) {
        var payloadData = request.payload;
        var userData =
                (request.auth &&
                    request.auth.credentials &&
                    request.auth.credentials.userData) ||
                null;
        return new Promise((resolve, reject) => {
            if (userData && userData._id) {
                    Controller.DocumentBaseController.deleteDocument(userData, payloadData, function (
                        error,
                        success
                    ) {
                        if (error) {
                            reject(UniversalFunctions.sendError(error));
                        } else {
                            resolve(
                                UniversalFunctions.sendSuccess(
                                    UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS
                                        .DEFAULT,
                                    success
                                )
                            );
                        }
                    });
                } else {
                    reject(
                        UniversalFunctions.sendError(
                            UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR
                                .INVALID_TOKEN
                        )
                    );
                }
            });
    },
    config: {
        auth: "UserAuth",
        description: "Delete documents for a user",
        tags: ["api", "document"],
        validate: {
            headers: UniversalFunctions.authorizationHeaderObj,
            payload: { 
                userId: Joi.string(),
                documentId: Joi.array().items(Joi.string()),
            },
            failAction: UniversalFunctions.failActionFunction
        },
        plugins: {
            "hapi-swagger": {
                responseMessages:
                    UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
            }
        }
    }
}

var DocumentBaseRoute = [
    createDocument,
    getDocument,
    getDocumentsByUserId,
    // updateDocument,
    deleteDocument
];
module.exports = DocumentBaseRoute;