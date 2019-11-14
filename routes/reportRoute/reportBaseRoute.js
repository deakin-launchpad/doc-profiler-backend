var UniversalFunctions = require("../../utils/universalFunctions");
var Controller = require("../../controllers");
var Joi = require("joi");
var Config = require("../../config");

const createReport = {
    method: 'GET',
    path: '/api/report/create',
    config: {
        description: 'Create a new document',
        tags: ['api', 'report'],
        handler: function (request, h) {
            const payloadData = request.query;
            return new Promise((resolve, reject) => {
                Controller.ReportBaseController.createReport(payloadData.data, function (
                    err,
                    data
                ) {
                    if (err) reject(UniversalFunctions.sendError(err));
                    else {
                        resolve(
                            UniversalFunctions.sendSuccess(
                                Config.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
                                data
                            )
                        );
                    }
                });
            });
        },
        validate: {
            query: {
                data: Joi.string().optional().allow(''),
            },
            failAction: UniversalFunctions.failActionFunction,
        },
        plugins: {
            'hapi-swagger': {
                responseMessages:
                    UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages,
            },
        },
    },
};

var ReportBaseRoute = [
    createReport
];
module.exports = ReportBaseRoute;