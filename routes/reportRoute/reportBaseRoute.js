var UniversalFunctions = require("../../utils/universalFunctions");
var Controller = require("../../controllers");
var Joi = require("joi");
var Config = require("../../config");

const createReport = {
    method: 'POST',
    path: '/api/report/create',
    config: {
        description: 'Create a new report',
        tags: ['api', 'report'],
        handler: function (request, h) {
            const payloadData = request.payload;
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
            payload: {
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

const sentenceAnalysis = {
  method: 'POST',
  path: '/api/report/sentenceAnalysis',
  config: {
      description: 'Sentence Analysis',
      tags: ['api', 'report'],
      handler: function (request, h) {
          const payloadData = request.payload;
          return new Promise((resolve, reject) => {
              Controller.ReportBaseController.sentenceAnalysis(payloadData, function (
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
          payload: {
              data: Joi.string().optional().allow(''),
              url: Joi.string().optional().allow('')
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
    createReport,
    sentenceAnalysis
];
module.exports = ReportBaseRoute;